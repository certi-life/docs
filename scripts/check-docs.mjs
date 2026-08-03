import {readFileSync, existsSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import ts from 'typescript';

const root = new URL('..', import.meta.url).pathname;
const docsRoot = join(root, 'docs');
const requiredDocs = [
  'intro.mdx',
  'getting-started/quick-tour.mdx',
  'getting-started/choose-guide.mdx',
  'getting-started/plans-and-contact.mdx',
  'getting-started/downloads.mdx',
  'getting-started/sign-in-directory.mdx',
  'products/certificate.mdx',
  'products/certificate/channels.mdx',
  'products/certificate/delivery-checklist.mdx',
  'products/ai-chatbot.mdx',
  'products/ai-chatbot/knowledge-preparation.mdx',
  'products/ai-chatbot/handoff-policy.mdx',
  'products/crm-messaging.mdx',
  'products/crm-messaging/segment-planning.mdx',
  'products/crm-messaging/message-checklist.mdx',
  'products/event-marketing.mdx',
  'products/event-marketing/campaign-planning.mdx',
  'products/event-marketing/performance-review.mdx',
  'hospital/overview.mdx',
  'hospital/account-access.mdx',
  'hospital/certificate-workflow.mdx',
  'hospital/safe-operation.mdx',
  'manufacturer/overview.mdx',
  'manufacturer/account-access.mdx',
  'manufacturer/safe-operation.mdx',
  'studio/overview.mdx',
  'studio/account-access.mdx',
  'studio/knowledge-management.mdx',
  'studio/scenario-and-handoff.mdx',
  'studio/launch-checklist.mdx',
  'help/faq.mdx',
  'help/privacy-security.mdx',
  'help/troubleshooting.mdx',
  'help/glossary.mdx',
];

const actionableDocs = requiredDocs.filter((path) =>
  path.includes('/') && !path.endsWith('overview.mdx') && !path.endsWith('quick-tour.mdx'),
);
const failures = [];

for (const path of requiredDocs) {
  const absolute = join(docsRoot, path);
  if (!existsSync(absolute)) {
    failures.push(`missing document: ${path}`);
    continue;
  }
  const content = readFileSync(absolute, 'utf8');
  if (!/^---[\s\S]*?description:\s*.+?[\s\S]*?---/m.test(content)) {
    failures.push(`missing frontmatter description: ${path}`);
  }
  if (!/^#\s+.+/m.test(content)) failures.push(`missing H1: ${path}`);
  if (actionableDocs.includes(path) && content.length < 900) {
    failures.push(`guide is too shallow (<900 chars): ${path}`);
  }
}

const sidebar = readFileSync(join(root, 'sidebars.ts'), 'utf8');
for (const path of requiredDocs) {
  const id = path.replace(/\.mdx$/, '');
  if (!sidebar.includes(`'${id}'`)) failures.push(`sidebar missing: ${id}`);
}

const config = readFileSync(join(root, 'docusaurus.config.ts'), 'utf8');
const configSource = ts.createSourceFile('docusaurus.config.ts', config, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function unwrapExpression(expression) {
  while (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isSatisfiesExpression(expression) ||
    ts.isTypeAssertionExpression(expression)
  ) {
    expression = expression.expression;
  }
  return expression;
}

function findUniqueProperty(object, name) {
  let match;
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property) || ts.isComputedPropertyName(property.name)) return undefined;
    if (
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === name
    ) {
      if (match || !ts.isPropertyAssignment(property)) return undefined;
      match = property;
    }
  }
  return match;
}

function findExportedConfigObject(sourceFile) {
  const exportDefault = sourceFile.statements.find(
    (statement) => ts.isExportAssignment(statement) && !statement.isExportEquals,
  );
  if (!exportDefault) return undefined;

  let expression = unwrapExpression(exportDefault.expression);
  if (ts.isIdentifier(expression)) {
    const declaration = sourceFile.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations)
      .find((candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === expression.text);
    if (!declaration?.initializer) return undefined;
    expression = unwrapExpression(declaration.initializer);
  }
  return ts.isObjectLiteralExpression(expression) ? expression : undefined;
}

function getClassicDocsEditUrl(sourceFile) {
  const configObject = findExportedConfigObject(sourceFile);
  const presetsProperty = configObject && findUniqueProperty(configObject, 'presets');
  const presets = presetsProperty && unwrapExpression(presetsProperty.initializer);
  if (!presets || !ts.isArrayLiteralExpression(presets)) return undefined;

  const classicPresets = presets.elements.filter((element) => {
    if (ts.isSpreadElement(element)) return false;
    const preset = unwrapExpression(element);
    if (!ts.isArrayLiteralExpression(preset) || preset.elements.length === 0) return false;
    const presetName = unwrapExpression(preset.elements[0]);
    return ts.isStringLiteral(presetName) && presetName.text === 'classic';
  });
  if (presets.elements.some(ts.isSpreadElement) || classicPresets.length !== 1) return undefined;

  const preset = unwrapExpression(classicPresets[0]);
  if (preset.elements.length < 2) return undefined;
  const options = unwrapExpression(preset.elements[1]);
  if (!ts.isObjectLiteralExpression(options)) return undefined;
  const docsProperty = findUniqueProperty(options, 'docs');
  const docs = docsProperty && unwrapExpression(docsProperty.initializer);
  if (!docs || !ts.isObjectLiteralExpression(docs)) return undefined;
  const editUrlProperty = findUniqueProperty(docs, 'editUrl');
  const editUrl = editUrlProperty && unwrapExpression(editUrlProperty.initializer);
  return editUrl && ts.isStringLiteral(editUrl) ? editUrl.text : undefined;
}

if (!config.includes("url: 'https://docs.certi.life'")) {
  failures.push('site URL must be https://docs.certi.life for the custom-domain deployment');
}
if (!config.includes("baseUrl: '/'")) {
  failures.push("baseUrl must be '/' when the custom domain serves the site root");
}
if (config.includes('https://certi-life.github.io') || config.includes("baseUrl: '/docs/'")) {
  failures.push('legacy GitHub project-page deployment remains in config');
}
if (getClassicDocsEditUrl(configSource) !== 'https://github.com/certi-life/docs/edit/develop/') {
  failures.push('docs must expose per-page GitHub edit links against the develop branch');
}
const koreanTranslations = JSON.parse(readFileSync(join(root, 'i18n', 'ko', 'code.json'), 'utf8'));
if (koreanTranslations['theme.common.editThisPage']?.message !== '이 페이지 개선하기') {
  failures.push('the per-page edit link must use the approved Korean label');
}
const cnamePath = join(root, 'static', 'CNAME');
if (existsSync(cnamePath)) failures.push('static/CNAME is unnecessary for the GitHub Actions Pages deployment');

const readme = readFileSync(join(root, 'README.md'), 'utf8');
if (!readme.includes('https://docs.certi.life')) {
  failures.push('README must name the current https://docs.certi.life deployment');
}
if (readme.includes('https://certi-life.github.io/docs/') || readme.includes('http://localhost:3000/docs/')) {
  failures.push('README still describes the legacy /docs/ deployment path');
}
if (readme.includes('커스텀 도메인은 아직 연결하지 않았습니다')) {
  failures.push('README still says the active custom domain is not connected');
}

const downloadsGuide = readFileSync(join(docsRoot, 'getting-started', 'downloads.mdx'), 'utf8');
const requiredDownloadsGuidance =
  '공식 다운로드 페이지에서 다운로드를 시작했는지 확인합니다. 공식 버튼은 데스크톱 설치 파일용 클라우드 저장소나 Google Play·App Store로 연결될 수 있습니다.';
if (!downloadsGuide.includes(requiredDownloadsGuidance)) {
  failures.push('downloads guide must preserve the approved official-source and external-destination guidance');
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const banned = [
  /WORK-\d+/i,
  /plane\.certi/i,
  /127\.0\.0\.1/,
  /localhost/i,
  /develop\s*(브랜치|branch)/i,
  /내부\s*(로드맵|문서화 계획|운영 지표)/i,
];

function stripFrontmatterAndFencedCode(content) {
  return content
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/```[\s\S]*?```/g, '');
}

function stripValidMarkdownLinks(content) {
  return content
    .replace(/!?\[([^\]]*)\]\(https?:\/\/[^)\s]+(?:\s+["'][^"']*["'])?\)/g, '$1')
    .replace(/<https?:\/\/[^>]+>/g, '');
}

for (const file of walk(docsRoot).filter((path) => path.endsWith('.mdx'))) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of banned) {
    if (pattern.test(content)) failures.push(`public-content violation ${pattern}: ${relative(root, file)}`);
  }

  const linkProse = stripFrontmatterAndFencedCode(content);
  const autolink = linkProse.match(/<https?:\/\/[^>]+>/);
  if (autolink) {
    failures.push(`external URL autolink must use descriptive link text (${autolink[0]}): ${relative(root, file)}`);
  }
  const urlAsLabel = linkProse.match(/\[\s*https?:\/\/[^\]]+\]\(https?:\/\/[^)\s]+\)/);
  if (urlAsLabel) {
    failures.push(`external link text must describe its destination: ${relative(root, file)}`);
  }
  const vagueLink = linkProse.match(/\[\s*(?:여기|링크|클릭)\s*\]\(https?:\/\/[^)\s]+\)/);
  if (vagueLink) {
    failures.push(`external link text is too vague (${vagueLink[0]}): ${relative(root, file)}`);
  }

  const prose = stripValidMarkdownLinks(linkProse);
  const rawUrl = prose.match(/https?:\/\/[^\s)`>]+/);
  if (rawUrl) {
    failures.push(`plain-text external URL must be a descriptive link (${rawUrl[0]}): ${relative(root, file)}`);
  }
  const copyNavigation = prose.match(
    /(?:브라우저\s*)?(?:주소창|주소 표시줄)(?:에|으로)[^\n]{0,100}(?:직접\s*)?(?:입력(?:하거나)?|복사|붙여넣기)/,
  );
  if (copyNavigation) {
    failures.push(`replace copy/paste navigation with a direct link: ${relative(root, file)}`);
  }
}

if (failures.length) {
  console.error(`Docs quality gate failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Docs quality gate passed: ${requiredDocs.length} required documents`);
