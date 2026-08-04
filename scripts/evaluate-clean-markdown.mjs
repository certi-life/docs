import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  createBaseline,
  evaluateCases,
  loadPublicDocuments,
  readJson,
  sha256,
  validateFixtureFile,
} from './ai-retrieval-eval.mjs';
import {requiredDocIds} from './docs-manifest.mjs';
import {projectCleanMarkdownArtifacts} from './generate-clean-markdown.mjs';

const REGRESSION_METRICS = [
  'top1Accuracy',
  'top3Accuracy',
  'evidencePassRate',
  'safetyPassRate',
  'prohibitedClaimPassRate',
];

export function assertNoEvaluationRegression(sourceMetrics, cleanMetrics) {
  for (const metric of REGRESSION_METRICS) {
    if (!Number.isFinite(sourceMetrics[metric]) || !Number.isFinite(cleanMetrics[metric])) {
      throw new Error(`${metric} must be a finite number`);
    }
    if (cleanMetrics[metric] < sourceMetrics[metric]) {
      throw new Error(`${metric} regressed: source=${sourceMetrics[metric]}, clean=${cleanMetrics[metric]}`);
    }
  }
}

export function evaluateCleanMarkdown(projectRoot) {
  const fixtureFile = readJson(join(projectRoot, 'tests', 'fixtures', 'ai-retrieval-cases.json'));
  const fixtures = validateFixtureFile(fixtureFile, new Set(requiredDocIds), {expectedCount: 30});
  const sourceDocuments = loadPublicDocuments(projectRoot, requiredDocIds);
  const sourceById = new Map(sourceDocuments.map((document) => [document.id, document]));
  const artifacts = projectCleanMarkdownArtifacts(projectRoot);
  const cleanDocuments = artifacts.map((artifact) => {
    const source = sourceById.get(artifact.id);
    return {
      ...source,
      headings: [...artifact.content.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim()),
      body: artifact.content,
      source: artifact.content,
    };
  });
  const sourceMetrics = createBaseline(sourceDocuments, fixtures).metrics;
  const cleanMetrics = evaluateCases(cleanDocuments, fixtures).metrics;
  assertNoEvaluationRegression(sourceMetrics, cleanMetrics);
  const sourceBytes = sourceDocuments.reduce((total, document) => total + Buffer.byteLength(document.source), 0);
  const cleanBytes = artifacts.reduce((total, artifact) => total + Buffer.byteLength(artifact.content), 0);
  return {
    schemaVersion: 1,
    sourceMetrics,
    cleanMetrics,
    bytes: {
      source: sourceBytes,
      clean: cleanBytes,
      delta: cleanBytes - sourceBytes,
      ratio: Number((cleanBytes / sourceBytes).toFixed(4)),
    },
    cleanCorpusSha256: sha256(artifacts.map((artifact) => `${artifact.path}\n${artifact.content}`).join('\n')),
  };
}

function run() {
  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  const artifactPath = join(projectRoot, 'artifacts', 'clean-markdown-evaluation.json');
  const result = evaluateCleanMarkdown(projectRoot);
  const rendered = `${JSON.stringify(result, null, 2)}\n`;
  if (process.argv.includes('--write')) {
    mkdirSync(dirname(artifactPath), {recursive: true});
    writeFileSync(artifactPath, rendered, 'utf8');
    console.log(`Clean Markdown evaluation written: Top1 ${(result.cleanMetrics.top1Accuracy * 100).toFixed(1)}%, Top3 ${(result.cleanMetrics.top3Accuracy * 100).toFixed(1)}%, byte ratio ${result.bytes.ratio}`);
    return;
  }
  if (!existsSync(artifactPath)) throw new Error('clean Markdown evaluation is missing; run npm run markdown:eval:generate');
  if (readFileSync(artifactPath, 'utf8') !== rendered) {
    throw new Error('clean Markdown evaluation is stale; regenerate and review the metric/cost delta');
  }
  console.log(`Clean Markdown evaluation passed: no retrieval regression, byte ratio ${result.bytes.ratio}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
