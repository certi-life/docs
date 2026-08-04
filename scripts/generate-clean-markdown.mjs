import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCleanMarkdownArtifacts, verifyCleanMarkdownArtifacts, writeCleanMarkdownArtifacts} from './clean-markdown.mjs';
import {requiredDocIds} from './docs-manifest.mjs';
import {publicDocUrl} from './generate-ai-discovery.mjs';

export function projectCleanMarkdownArtifacts(projectRoot) {
  const documents = requiredDocIds.map((id) => {
    const path = join(projectRoot, 'docs', `${id}.mdx`);
    if (!existsSync(path)) throw new Error(`missing public document source: docs/${id}.mdx`);
    return {id, canonicalUrl: publicDocUrl(id), source: readFileSync(path, 'utf8')};
  });
  return createCleanMarkdownArtifacts(documents);
}

function run() {
  const scriptsRoot = dirname(fileURLToPath(import.meta.url));
  const projectRoot = join(scriptsRoot, '..');
  const artifacts = projectCleanMarkdownArtifacts(projectRoot);
  if (process.argv.includes('--write')) {
    writeCleanMarkdownArtifacts(projectRoot, artifacts);
    console.log(`Clean Markdown generated: ${artifacts.length} endpoints`);
    return;
  }
  const buildRoot = process.argv.includes('--build') ? join(projectRoot, 'build') : undefined;
  verifyCleanMarkdownArtifacts(projectRoot, artifacts, {buildRoot});
  console.log(`Clean Markdown passed: ${artifacts.length} endpoints${buildRoot ? ', build bytes verified' : ''}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
