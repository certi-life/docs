import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import matter from '@11ty/gray-matter';
import {requiredDocIds} from './docs-manifest.mjs';

const scopeFirstPattern = /^(?:(?:이|본)\s+(?:문서|가이드|체크리스트|용어집|페이지)(?:는|은)|(?:여기|이곳)(?:에서는|서)|(?:다음|아래)에서는)|^(?:[^.!?]{0,50}(?:다루는|설명하는|안내하는)\s*범위|[^.!?]{0,50}범위와\s*주의사항)/;
const placeholderPattern = /(?:TODO|TBD|준비\s*중|추후\s*(?:작성|확인)|나중에\s*(?:작성|확인)|아직[^.!?]{0,40}(?:확인하지|작성해야))/i;
const fillerPattern = /(?:답변\s*대신|내용을\s*(?:충분히|임의로)?\s*길게|의미\s*없이|문장을?\s*반복|분량을\s*(?:채우|늘리))/;
const metaOnlyOpeningPattern = /^[^.!?]{0,160}(?:(?:설명|소개)합니다|정리(?:해|하여)\s*안내합니다)\./;
const answerEndingPattern = /(?:입니다|합니다|됩니다|있습니다|없습니다|마세요|하세요|됩니다|됩니다)\.(?:\s|$)/;

export function classifyOpening(opening) {
  const normalized = opening.replace(/\s+/g, ' ').trim();
  if (normalized.length < 20 || normalized.length > 400) {
    return {classification: 'fail', reasons: [normalized.length > 400 ? 'opening-too-long' : 'opening-too-short']};
  }
  const sentences = normalized.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  if (new Set(sentences).size !== sentences.length) {
    return {classification: 'fail', reasons: ['opening-repeats-sentences']};
  }
  if ((normalized.match(/[가-힣]/g) ?? []).length < 10 || placeholderPattern.test(normalized) || !answerEndingPattern.test(normalized)) {
    return {classification: 'fail', reasons: ['opening-lacks-a-complete-public-answer-or-contains-placeholder-language']};
  }
  if (scopeFirstPattern.test(normalized)) {
    return {classification: 'review', reasons: ['scope-first opening; verify that the user-facing answer precedes boundary details']};
  }
  if (metaOnlyOpeningPattern.test(normalized)) {
    return {classification: 'review', reasons: ['meta-only opening; state the user-facing answer before describing document coverage']};
  }
  if (fillerPattern.test(normalized)) {
    return {classification: 'fail', reasons: ['opening-lacks-a-complete-public-answer-or-contains-placeholder-language']};
  }
  return {classification: 'pass', reasons: []};
}

function firstProseParagraph(source) {
  const body = matter(source).content;
  const lines = body.split(/\r?\n/);
  const paragraph = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence || /^\s*(?:import|export)\s/.test(line) || /^\s*#/.test(line) || /^\s*:::+/.test(line) || /^\s*</.test(line)) {
      if (paragraph.length) break;
      continue;
    }
    if (!line.trim()) {
      if (paragraph.length) break;
      continue;
    }
    if (/^\s*(?:[-*+] |\d+\. |\|)/.test(line)) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(line.trim());
  }
  return paragraph.join(' ');
}

export function auditPublicDocuments(projectRoot) {
  return requiredDocIds.map((id) => {
    const source = readFileSync(join(projectRoot, 'docs', `${id}.mdx`), 'utf8');
    const opening = firstProseParagraph(source);
    return {id, opening, ...classifyOpening(opening)};
  });
}

function escapeCell(value) {
  return value.replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

export function renderAuditReport(entries) {
  const counts = Object.fromEntries(['pass', 'review', 'fail'].map((key) => [key, entries.filter((entry) => entry.classification === key).length]));
  const lines = [
    '# 공개 문서 answer-first 기계 감사',
    '',
    `총 ${entries.length}개: pass ${counts.pass}, review ${counts.review}, fail ${counts.fail}`,
    '',
    '분류 계약:',
    '- `pass`: 첫 본문 문단에 충분한 한국어 완결문이 있고 범위 소개·placeholder로 시작하지 않아 answer-first 수동 검토 후보를 통과합니다.',
    '- `review`: “이 문서/가이드/체크리스트/용어집” 범위 설명으로 시작해 핵심 답변 선행 여부를 사람이 확인해야 합니다.',
    '- `fail`: 첫 본문 문단이 없거나 너무 짧거나, 한국어 완결문·공개 답변 대신 placeholder 문구만 있습니다.',
    '',
    '이 감사는 문장의 의미나 공개 근거를 자동 인증하지 않습니다. `pass`도 사람이 원문을 읽어 확인하며, `review` 문서는 기존 공개 내용 안에서만 최소 수정합니다.',
    '',
    '| 문서 | 분류 | 근거 | 첫 문단 |',
    '|---|---|---|---|',
  ];
  for (const entry of entries) {
    lines.push(`| ${entry.id} | ${entry.classification} | ${escapeCell(entry.reasons.join('; ') || '-')} | ${escapeCell(entry.opening)} |`);
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  const outputPath = join(projectRoot, 'artifacts', 'answer-first-audit.md');
  const expected = renderAuditReport(auditPublicDocuments(projectRoot));
  if (process.argv.includes('--write')) {
    writeFileSync(outputPath, expected, 'utf8');
    console.log('wrote artifacts/answer-first-audit.md');
    return;
  }
  if (process.argv.includes('--check')) {
    const actual = readFileSync(outputPath, 'utf8');
    if (actual !== expected) throw new Error('stale answer-first audit; run npm run content:audit:generate');
    const entries = auditPublicDocuments(projectRoot);
    const failures = entries.filter((entry) => entry.classification !== 'pass');
    if (failures.length) throw new Error(`answer-first contract requires review: ${failures.map((entry) => entry.id).join(', ')}`);
    console.log(`Answer-first audit passed: ${entries.length} public documents`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
