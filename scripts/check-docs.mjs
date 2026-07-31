import {readFileSync, existsSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';

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
if (!config.includes("url: 'https://certi-life.github.io'")) {
  failures.push('site URL must be https://certi-life.github.io for GitHub Pages');
}
if (!config.includes("baseUrl: '/docs/'")) {
  failures.push("baseUrl must be '/docs/' for the GitHub project page");
}
if (config.includes('docs.certi.life') || config.includes("baseUrl: '/'")) {
  failures.push('unconfigured custom-domain deployment remains in config');
}
const cnamePath = join(root, 'static', 'CNAME');
if (existsSync(cnamePath)) failures.push('static/CNAME must be absent until the custom domain is configured');

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
