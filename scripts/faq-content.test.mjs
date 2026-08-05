import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import matter from '@11ty/gray-matter';

const faq = readFileSync(join(import.meta.dirname, '..', 'docs', 'help', 'faq.mdx'), 'utf8');
const buyerFaq = readFileSync(join(import.meta.dirname, '..', 'docs', 'getting-started', 'buyer-faq.mdx'), 'utf8');

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

test('구매 FAQ 공개판은 원장·상담실장의 핵심 선구매 질문을 직접 답한다', () => {
  const questions = [...buyerFaq.matchAll(/^## (.+\?)$/gm)].map((match) => match[1]);
  const schemaQuestions = matter(buyerFaq).data.faq_items.map(({question}) => question);
  assert.ok(questions.length >= 12, `expected at least 12 buyer questions, actual=${questions.length}`);
  assert.deepEqual(schemaQuestions, questions, 'visible questions and FAQPage frontmatter must stay aligned');
  for (const question of [
    'CertiLife는 어떤 서비스인가요?',
    '가격은 얼마인가요?',
    'AI 상담은 어떤 채널에서 사용할 수 있나요?',
    'AI가 답하지 못하는 문의는 어떻게 처리하나요?',
    'AI 상담이 의료진을 대신하나요?',
    '도입 전에 병원이 준비할 것은 무엇인가요?',
  ]) {
    assert.ok(questions.includes(question), `missing buyer question: ${question}`);
  }
});

test('구매 FAQ 공개판은 미확정 정책과 내부 작업 표시를 공개하지 않는다', () => {
  assert.doesNotMatch(buyerFaq, /\[정책 필요\]|\[확인 필요\]|SLA|최소 계약기간|환불 조건/);
  assert.doesNotMatch(buyerFaq, /편한치과|장호열치과|덴티움치과|서울더스퀘어치과|닥터허치과/);
  assert.match(buyerFaq, /^structured_data: faq$/m);
});
