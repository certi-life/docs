import assert from 'node:assert/strict';
import test from 'node:test';
import {join} from 'node:path';
import {
  auditPublicDocuments,
  classifyOpening,
  renderAuditReport,
} from './content-contract.mjs';
import {requiredDocIds} from './docs-manifest.mjs';

test('classifyOpening은 핵심 답변으로 시작하는 문단을 pass로 분류한다', () => {
  const result = classifyOpening('CertiLife 인증서는 고객이 시술·제품 정보를 모바일에서 다시 확인하도록 돕는 서비스입니다.');
  assert.equal(result.classification, 'pass');
  assert.deepEqual(result.reasons, []);
});

test('classifyOpening은 문서 소개·범위 고지로만 시작하는 문단을 review로 분류한다', () => {
  const result = classifyOpening('이 문서는 공개 로그인 문제의 기본 점검 방법을 안내합니다.');
  assert.equal(result.classification, 'review');
  assert.match(result.reasons.join(' '), /scope-first/);
});

test('classifyOpening은 비어 있거나 지나치게 짧은 첫 문단을 fail로 분류한다', () => {
  assert.equal(classifyOpening('').classification, 'fail');
  assert.equal(classifyOpening('확인하세요.').classification, 'fail');
  assert.equal(classifyOpening('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx').classification, 'fail');
  assert.equal(classifyOpening('아직 내용을 확인하지 못했으므로 담당자가 나중에 이 문단을 작성해야 합니다.').classification, 'fail');
  assert.equal(classifyOpening('이 페이지는 실제 답변 대신 작성 범위와 주의사항만 길게 설명하는 소개 문장입니다.').classification, 'review');
  assert.equal(classifyOpening('여기에서는 공개 로그인 문서가 다루는 범위와 주의사항만 안내합니다.').classification, 'review');
  assert.equal(classifyOpening('로그인 문제와 관련해 사용자가 살펴볼 항목들을 차례로 설명합니다.').classification, 'review');
  assert.equal(classifyOpening('인증서 발급 과정에서 확인할 대상과 주의할 요소를 순서대로 소개합니다.').classification, 'review');
  assert.equal(classifyOpening('고객 상담 업무에 관한 주요 항목을 이해하기 쉽게 정리해 안내합니다.').classification, 'review');
  assert.equal(classifyOpening('실제 답변 대신 의미 없이 내용을 충분히 길게 작성하여 분량을 채웁니다.').classification, 'fail');
  assert.equal(classifyOpening(Array(16).fill('사용자는 안내를 확인하고 내용을 검토합니다.').join(' ')).classification, 'fail');
});

test('공개 문서 감사는 전체 manifest를 결정론적으로 검사하고 감사 시각이나 임의 점수를 넣지 않는다', () => {
  const root = join(import.meta.dirname, '..');
  const first = auditPublicDocuments(root);
  const second = auditPublicDocuments(root);
  assert.equal(first.length, requiredDocIds.length);
  assert.deepEqual(first, second);
  assert.ok(first.every((entry) => ['pass', 'review', 'fail'].includes(entry.classification)));
  const report = renderAuditReport(first);
  assert.equal(report, renderAuditReport(second));
  assert.doesNotMatch(report, /generatedAt|점수|score/i);
  assert.match(report, new RegExp(`${requiredDocIds.length}개`));
});
