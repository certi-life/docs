import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const faq = readFileSync(join(import.meta.dirname, '..', 'docs', 'help', 'faq.mdx'), 'utf8');

const adoptionQuestions = [
  'AI 상담은 어떤 채널에서 사용할 수 있나요?',
  'AI 상담 도입 전에 무엇을 준비해야 하나요?',
  'AI가 답하지 못하는 문의는 어떻게 처리하나요?',
  'AI 채팅봇과 AI 음성봇은 어떻게 다른가요?',
];

test('도입 검토 FAQ는 병원이 실제로 묻는 채널·준비·인계·음성봇 질문을 직접 답한다', () => {
  for (const question of adoptionQuestions) {
    assert.match(faq, new RegExp(`^## ${question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }
});

test('도입 검토 FAQ는 공개 제품·운영·가격 문서로 이어지고 미공개 조건을 추측하지 않는다', () => {
  for (const link of [
    '../products/ai-chatbot',
    '../products/ai-chatbot/knowledge-preparation',
    '../products/ai-chatbot/handoff-policy',
    '../getting-started/plans-and-contact',
  ]) {
    assert.match(faq, new RegExp(`\\(${link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`));
  }
  assert.doesNotMatch(faq, /(?:도입|구축)\s*(?:기간|완료일)은?\s*\d/);
  assert.doesNotMatch(faq, /SLA|서비스 수준 협약/);
  assert.doesNotMatch(faq, /환자 개인정보를 AI 학습에 사용(?:합니다|하지 않습니다)/);
});
