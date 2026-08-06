import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {isIP} from 'node:net';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import matter from '@11ty/gray-matter';

const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

export function tokenize(input) {
  const tokens = [];
  const words = String(input ?? '').toLocaleLowerCase('ko-KR').match(WORD_PATTERN) ?? [];
  for (const word of words) {
    tokens.push(word);
    if (/^[\p{Script=Hangul}\p{N}]+$/u.test(word) && word.length >= 2) {
      for (let size = 2; size <= Math.min(3, word.length); size += 1) {
        for (let index = 0; index <= word.length - size; index += 1) {
          tokens.push(word.slice(index, index + size));
        }
      }
    }
  }
  return tokens;
}

export function rankDocuments(query, docs, limit = 3) {
  const queryWords = [...new Set(String(query ?? '').toLocaleLowerCase('ko-KR').match(WORD_PATTERN) ?? [])];
  const queryTokens = [...new Set(tokenize(query))];
  const fullWords = new Set(queryWords);
  const normalizedDocs = docs.map((doc) => ({
    doc,
    fields: [
      String(doc.title ?? '').toLocaleLowerCase('ko-KR'),
      String(doc.description ?? '').toLocaleLowerCase('ko-KR'),
      (doc.headings ?? []).join(' ').toLocaleLowerCase('ko-KR'),
      String(doc.body ?? '').toLocaleLowerCase('ko-KR'),
    ],
  }));
  const documentFrequency = new Map();
  for (const token of queryTokens) {
    documentFrequency.set(token, normalizedDocs.filter(({fields}) => fields.some((field) => field.includes(token))).length);
  }
  const normalizedQuery = String(query).trim().toLocaleLowerCase('ko-KR');
  return normalizedDocs
    .map(({doc, fields}) => {
      let score = 0;
      for (const token of queryTokens) {
        const df = documentFrequency.get(token) ?? 0;
        const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
        const weights = fullWords.has(token) ? [18, 10, 4, 0.8] : [3, 1, 0.2, 0.03];
        fields.forEach((field, index) => {
          if (field.includes(token)) score += weights[index] * idf;
        });
      }
      const titleWordCoverage = queryWords.length ? queryWords.filter((word) => fields[0].includes(word)).length / queryWords.length : 0;
      const descriptionWordCoverage = queryWords.length ? queryWords.filter((word) => fields[1].includes(word)).length / queryWords.length : 0;
      score += titleWordCoverage * 30 + descriptionWordCoverage * 15;
      if (normalizedQuery && fields[0].includes(normalizedQuery)) score += 40;
      if (normalizedQuery && fields[1].includes(normalizedQuery)) score += 20;
      return {id: doc.id, score: Number(score.toFixed(6))};
    })
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id, 'en'))
    .slice(0, limit);
}

function includesExact(text, phrase) {
  return String(text).normalize('NFC').includes(String(phrase).normalize('NFC'));
}

export function evaluateAnswer(answer, fixture) {
  const citations = [...String(answer).matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
  const allowed = new Set(fixture.expectedTop3 ?? []);
  const citationPassed = citations.some((citation) => allowed.has(citation));
  const forbiddenMatches = (fixture.forbiddenClaims ?? []).filter((claim) => includesExact(answer, claim));
  return {
    passed: citationPassed && forbiddenMatches.length === 0,
    citationPassed,
    citations,
    forbiddenMatches,
  };
}

export function evaluateCases(docs, fixtures) {
  const docById = new Map(docs.map((doc) => [doc.id, doc]));
  const cases = fixtures.map((fixture) => {
    const ranked = rankDocuments(fixture.question, docs, 3);
    const rankedIds = ranked.map(({id}) => id);
    const expectedDoc = docById.get(fixture.expectedTop1);
    if (!expectedDoc) throw new Error(`${fixture.id}: unknown expectedTop1 ${fixture.expectedTop1}`);
    for (const id of fixture.expectedTop3) {
      if (!docById.has(id)) throw new Error(`${fixture.id}: unknown expectedTop3 ${id}`);
    }
    const evidenceText = [expectedDoc.title, expectedDoc.description, ...(expectedDoc.headings ?? []), expectedDoc.body].join('\n');
    const missingEvidence = (fixture.requiredEvidence ?? []).filter((phrase) => !includesExact(evidenceText, phrase));
    const retrievedText = rankedIds.map((id) => {
      const doc = docById.get(id);
      return [doc.title, doc.description, ...(doc.headings ?? []), doc.body].join('\n');
    }).join('\n');
    const forbiddenMatches = (fixture.forbiddenClaims ?? []).filter((claim) => includesExact(retrievedText, claim));
    const prohibitedClaimsPassed = (fixture.forbiddenClaims ?? []).length > 0
      ? forbiddenMatches.length === 0
      : null;
    const top3Passed = rankedIds.includes(fixture.expectedTop1);
    const evidencePassed = top3Passed && missingEvidence.length === 0;
    const safetyPassed = fixture.category === 'safety'
      ? top3Passed && forbiddenMatches.length === 0
      : null;
    return {
      id: fixture.id,
      category: fixture.category,
      question: fixture.question,
      expectedTop1: fixture.expectedTop1,
      expectedTop3: fixture.expectedTop3,
      ranked,
      top1Passed: rankedIds[0] === fixture.expectedTop1,
      top3Passed,
      top3SetCoverage: fixture.expectedTop3.filter((id) => rankedIds.includes(id)).length / fixture.expectedTop3.length,
      evidencePassed,
      missingEvidence,
      safetyPassed,
      prohibitedClaimsPassed,
      forbiddenMatches,
    };
  });
  const ratio = (items, predicate) => items.length ? items.filter(predicate).length / items.length : 0;
  const safetyCases = cases.filter((item) => item.category === 'safety');
  const prohibitedClaimCases = cases.filter((item) => item.prohibitedClaimsPassed !== null);
  return {
    metrics: {
      caseCount: cases.length,
      safetyCaseCount: safetyCases.length,
      prohibitedClaimCaseCount: prohibitedClaimCases.length,
      top1Accuracy: ratio(cases, (item) => item.top1Passed),
      top3Accuracy: ratio(cases, (item) => item.top3Passed),
      meanTop3SetCoverage: cases.length ? cases.reduce((sum, item) => sum + item.top3SetCoverage, 0) / cases.length : 0,
      evidencePassRate: ratio(cases, (item) => item.evidencePassed),
      safetyPassRate: ratio(safetyCases, (item) => item.safetyPassed),
      prohibitedClaimPassRate: ratio(prohibitedClaimCases, (item) => item.prohibitedClaimsPassed),
    },
    cases,
  };
}

export function loadPublicDocuments(projectRoot, ids) {
  return ids.map((id) => {
    const path = join(projectRoot, 'docs', `${id}.mdx`);
    const source = readFileSync(path, 'utf8').normalize('NFC');
    const parsed = matter(source);
    const {title, description} = parsed.data;
    if (typeof title !== 'string' || typeof description !== 'string') {
      throw new Error(`${id}: title and description must be strings`);
    }
    const body = parsed.content;
    const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim());
    return {id, title, description, headings, body, source};
  });
}

const ALLOWED_CATEGORIES = new Set(['product', 'role', 'faq', 'safety', 'recovery']);
const ALLOWED_PUBLIC_HOSTS = new Set([
  'certi.life',
  'docs.certi.life',
  'hospital.certi.life',
  'manufacturer.certi.life',
  'studio.certi.life',
]);
const NON_PUBLIC_PATTERNS = [
  /\bWORK-\d+\b/i,
  /\bplane\.certi\b/i,
  /\blocalhost\b|\b127\.0\.0\.1\b/i,
  /\b(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}\b/,
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  /(?<![0-9a-f])[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}(?![0-9a-f])/i,
  /(?<![0-9a-f])[0-9a-f]{32}(?![0-9a-f])/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/,
  /(?:\(?0\d{1,3}\)?[ .-]?\d{3,4}[ .-]?\d{4})/,
  /(?:\+82[ .-]?(?:\(0\)[ .-]?)?\(?\d{1,3}\)?[ .-]?\d{3,4}[ .-]?\d{4})/,
  /\b1[5-8]\d{2}[ .-]\d{4}\b/,
];
const FIXTURE_FIELDS = new Set([
  'id',
  'question',
  'category',
  'expectedTop1',
  'expectedTop3',
  'requiredEvidence',
  'forbiddenClaims',
]);

const SAFE_SECRET_PLACEHOLDER = /^(?:<YOUR_[A-Z0-9_]+>|REPLACE_ME|REDACTED|PLACEHOLDER|\*{3})(?:은|는|이|가|을|를|과|와|의|에|에서|으로|로|입니다)?[.!?。]?$/;
const SAFE_PUNCTUATED_SECRET_TAIL = /^(?:[.,!?。,:;)]$|,\s+값을\s+바꿉니다[.!?。]?$|\.\s+입니다[.!?。]?$)/;
const SAFE_QUOTED_SECRET_TAIL = /^(?:$|(?:은|는|이|가|을|를|과|와|의|에|에서|으로|로)(?:\s+(?:입력|사용|확인|설정)합니다)?[.!?。]?|입니다[.!?。]?|\s+(?:for\s+(?:local\s+)?testing|when\s+testing|in\s+(?:an?\s+)?(?:example|documentation)|(?:입력|사용|확인|설정)합니다|입니다)[.!?。]?)$/i;
const SAFE_UNQUOTED_SECRET_TAIL = /^(?:\s*$|\s+(?:for\s+(?:local\s+)?testing|when\s+testing|in\s+(?:an?\s+)?(?:example|documentation)|(?:입력|사용|확인|설정)합니다|입니다)[.!?。]?)$/i;

function containsUnsafeSecretAssignment(value) {
  const normalized = value.replace(/\\+(?=["'])/g, '');
  const assignment = /(?:api[_-]?key|token|secret|authorization)(?:["']|\s)*[:=]\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^\s,;}\]]+))/gi;
  for (const match of normalized.matchAll(assignment)) {
    const quoted = match[1] !== undefined || match[2] !== undefined;
    const candidate = match[1] ?? match[2] ?? match[3];
    if (!SAFE_SECRET_PLACEHOLDER.test(candidate)) return true;
    const tail = normalized.slice(match.index + match[0].length);
    const tailPassed = SAFE_PUNCTUATED_SECRET_TAIL.test(tail) ||
      (quoted ? SAFE_QUOTED_SECRET_TAIL.test(tail) : SAFE_UNQUOTED_SECRET_TAIL.test(tail));
    if (!tailPassed) {
      return true;
    }
  }
  return false;
}

function assertPublicFixtureText(value, fixtureId) {
  if (containsUnsafeSecretAssignment(value)) {
    throw new Error(`fixture ${fixtureId} contains a non-public identifier`);
  }
  for (const pattern of NON_PUBLIC_PATTERNS) {
    if (pattern.test(value)) throw new Error(`fixture ${fixtureId} contains a non-public identifier`);
  }
  for (const match of value.matchAll(/[0-9a-f:]{2,}/gi)) {
    if (isIP(match[0]) === 6) throw new Error(`fixture ${fixtureId} contains a non-public identifier`);
  }
  for (const match of value.matchAll(/https?:\/\/[^\s"'<>]+/gi)) {
    let host;
    try {
      host = new URL(match[0]).hostname.toLocaleLowerCase('en-US');
    } catch {
      throw new Error(`fixture ${fixtureId} contains a malformed URL`);
    }
    if (!ALLOWED_PUBLIC_HOSTS.has(host)) {
      throw new Error(`fixture ${fixtureId} contains a non-public URL host`);
    }
  }
}

export function validateFixtures(fixtures, publicIds, {expectedCount = 30} = {}) {
  if (!Array.isArray(fixtures) || fixtures.length !== expectedCount) {
    throw new Error(`fixture set must contain exactly ${expectedCount} cases`);
  }
  const ids = new Set();
  for (const fixture of fixtures) {
    if (!fixture || typeof fixture !== 'object') throw new Error('fixture must be an object');
    const unknownFields = Object.keys(fixture).filter((key) => !FIXTURE_FIELDS.has(key));
    if (unknownFields.length > 0) throw new Error(`fixture contains unknown field: ${unknownFields.join(', ')}`);
    if (typeof fixture.id !== 'string' || !fixture.id) throw new Error('fixture id is required');
    if (ids.has(fixture.id)) throw new Error(`duplicate fixture id: ${fixture.id}`);
    ids.add(fixture.id);
    if (typeof fixture.question !== 'string' || fixture.question.length < 4) {
      throw new Error(`${fixture.id}: question is too short`);
    }
    for (const [key, value] of Object.entries(fixture)) {
      if (typeof value === 'string') assertPublicFixtureText(value, `${fixture.id}.${key}`);
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item !== 'string') throw new Error(`${fixture.id}.${key}: all values must be strings`);
          assertPublicFixtureText(item, `${fixture.id}.${key}`);
        }
      }
    }
    if (!ALLOWED_CATEGORIES.has(fixture.category)) throw new Error(`${fixture.id}: invalid category`);
    if (!publicIds.has(fixture.expectedTop1)) throw new Error(`${fixture.id}: unknown expectedTop1`);
    if (!Array.isArray(fixture.expectedTop3) || fixture.expectedTop3.length !== 3 || new Set(fixture.expectedTop3).size !== 3) {
      throw new Error(`${fixture.id}: expectedTop3 must contain exactly 3 unique document ids`);
    }
    if (!fixture.expectedTop3.includes(fixture.expectedTop1)) {
      throw new Error(`${fixture.id}: expectedTop3 must include expectedTop1`);
    }
    for (const id of fixture.expectedTop3) {
      if (!publicIds.has(id)) throw new Error(`${fixture.id}: unknown expectedTop3 ${id}`);
    }
    if (!Array.isArray(fixture.requiredEvidence) || fixture.requiredEvidence.length === 0 || fixture.requiredEvidence.some((item) => typeof item !== 'string' || !item)) {
      throw new Error(`${fixture.id}: requiredEvidence must be a non-empty string array`);
    }
    if (!Array.isArray(fixture.forbiddenClaims) || fixture.forbiddenClaims.some((item) => typeof item !== 'string' || !item)) {
      throw new Error(`${fixture.id}: forbiddenClaims must be a string array`);
    }
  }
  if (!fixtures.some((fixture) => fixture.category === 'safety' && fixture.forbiddenClaims.length > 0)) {
    throw new Error('fixture set must include at least one safety case with forbidden claims');
  }
  return fixtures;
}

export function createBaseline(docs, fixtures) {
  const evaluation = evaluateCases(docs, fixtures);
  return {
    schemaVersion: 1,
    algorithm: 'weighted-unicode-ngram-v1',
    corpusSha256: sha256(docs.map(({id, source}) => `${id}\0${source ?? ''}`).join('\0')),
    fixtureSha256: sha256(JSON.stringify(fixtures)),
    metrics: evaluation.metrics,
    cases: evaluation.cases,
  };
}

const DEFAULT_THRESHOLDS = {
  top1Accuracy: 0.7,
  top3Accuracy: 0.9,
  meanTop3SetCoverage: 0.5,
  evidencePassRate: 1,
  safetyPassRate: 1,
  prohibitedClaimPassRate: 1,
};

export function verifyBaselineThresholds(metrics, thresholds = DEFAULT_THRESHOLDS) {
  for (const [name, minimum] of Object.entries(thresholds)) {
    if (typeof metrics[name] !== 'number' || metrics[name] < minimum) {
      throw new Error(`${name} ${metrics[name]} is below required ${minimum}`);
    }
  }
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function validateFixtureFile(fixtureFile, publicIds, options = {}) {
  if (!fixtureFile || typeof fixtureFile !== 'object' || Array.isArray(fixtureFile)) {
    throw new Error('fixture file root must be an object');
  }
  const allowedRootFields = new Set(['schemaVersion', 'cases']);
  const unknownRootFields = Object.keys(fixtureFile).filter((key) => !allowedRootFields.has(key));
  if (unknownRootFields.length > 0) throw new Error(`fixture file contains unknown root field: ${unknownRootFields.join(', ')}`);
  if (fixtureFile.schemaVersion !== 1) throw new Error('fixture schemaVersion must equal 1');
  validateFixtures(fixtureFile.cases, publicIds, options);
  return fixtureFile.cases;
}

const invokedPath = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (invokedPath) {
  const {requiredDocIds} = await import('./docs-manifest.mjs');
  const scriptsRoot = dirname(fileURLToPath(import.meta.url));
  const projectRoot = join(scriptsRoot, '..');
  const fixturePath = join(projectRoot, 'tests', 'fixtures', 'ai-retrieval-cases.json');
  const baselinePath = join(projectRoot, 'artifacts', 'ai-retrieval-baseline.json');
  const fixtureFile = readJson(fixturePath);
  const fixtures = validateFixtureFile(fixtureFile, new Set(requiredDocIds), {expectedCount: 30});
  const docs = loadPublicDocuments(projectRoot, requiredDocIds);
  const baseline = createBaseline(docs, fixtures);
  verifyBaselineThresholds(baseline.metrics);
  const rendered = `${JSON.stringify(baseline, null, 2)}\n`;
  const mode = process.argv.includes('--write') ? 'write' : 'check';
  if (mode === 'write') {
    mkdirSync(dirname(baselinePath), {recursive: true});
    writeFileSync(baselinePath, rendered, 'utf8');
    console.log(`AI retrieval baseline written: ${baseline.metrics.caseCount} cases, Top1 ${(baseline.metrics.top1Accuracy * 100).toFixed(1)}%, Top3 ${(baseline.metrics.top3Accuracy * 100).toFixed(1)}%`);
  } else {
    if (!existsSync(baselinePath)) throw new Error('AI retrieval baseline is missing; run npm run ai-eval:generate');
    if (readFileSync(baselinePath, 'utf8') !== rendered) {
      throw new Error('AI retrieval baseline is stale; run npm run ai-eval:generate and review the metric delta');
    }
    console.log(`AI retrieval baseline passed: ${baseline.metrics.caseCount} cases, Top1 ${(baseline.metrics.top1Accuracy * 100).toFixed(1)}%, Top3 ${(baseline.metrics.top3Accuracy * 100).toFixed(1)}%`);
  }
}
