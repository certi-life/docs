import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  COMBINED_MARKDOWN_PATH,
  createCleanMarkdownArtifacts,
  renderCombinedMarkdown,
  verifyCleanMarkdownArtifacts,
  verifyCombinedMarkdown,
  writeCleanMarkdownArtifacts,
} from './clean-markdown.mjs';
import {docsSections, requiredDocIds} from './docs-manifest.mjs';
import {publicDocUrl} from './generate-ai-discovery.mjs';

export function projectCleanMarkdownArtifacts(projectRoot) {
  const documents = requiredDocIds.map((id) => {
    const path = join(projectRoot, 'docs', `${id}.mdx`);
    if (!existsSync(path)) throw new Error(`missing public document source: docs/${id}.mdx`);
    return {id, canonicalUrl: publicDocUrl(id), source: readFileSync(path, 'utf8')};
  });
  return createCleanMarkdownArtifacts(documents);
}

// Single-file corpus for manual upload as chatbot training material. The file name is an upload key: never rename it.
export function projectCombinedMarkdown(artifacts) {
  return renderCombinedMarkdown(docsSections, artifacts, {
    title: 'CertiLife Docs',
    summary: 'CertiLife 공식 공개 사용 가이드 전체를 한 파일로 합친 AI 학습용 문서입니다. 각 페이지 제목과 섹션 제목 아래의 "출처:" 줄이 사람이 읽는 원문 주소입니다.',
  });
}

function run() {
  const scriptsRoot = dirname(fileURLToPath(import.meta.url));
  const projectRoot = join(scriptsRoot, '..');
  const artifacts = projectCleanMarkdownArtifacts(projectRoot);
  const combined = projectCombinedMarkdown(artifacts);
  if (process.argv.includes('--write')) {
    writeCleanMarkdownArtifacts(projectRoot, artifacts);
    writeFileSync(join(projectRoot, 'static', COMBINED_MARKDOWN_PATH), combined, 'utf8');
    const combinedKb = Math.round(Buffer.byteLength(combined) / 1024);
    console.log(`Clean Markdown generated: ${artifacts.length} endpoints, ${COMBINED_MARKDOWN_PATH} ${combinedKb}KB`);
    if (combinedKb > 800) console.warn(`${COMBINED_MARKDOWN_PATH} is approaching 1MB (${combinedKb}KB); review the training-material upload limit`);
    return;
  }
  const buildRoot = process.argv.includes('--build') ? join(projectRoot, 'build') : undefined;
  verifyCleanMarkdownArtifacts(projectRoot, artifacts, {buildRoot});
  verifyCombinedMarkdown(projectRoot, combined, {buildRoot});
  console.log(`Clean Markdown passed: ${artifacts.length} endpoints${buildRoot ? ', build bytes verified' : ''}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
