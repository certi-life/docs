import assert from 'node:assert/strict';
import test from 'node:test';
import {join} from 'node:path';
import {fetchWithRetry, loadDocNavigationTitle, loadDocTitle, validateHtmlBody, verifyResponse} from './verify-production.mjs';

const projectRoot = join(import.meta.dirname, '..');

test('fetchWithRetry는 일시적 5xx만 제한 횟수 재시도하고 성공 응답을 반환한다', async () => {
  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    return new Response(attempts < 3 ? 'temporary' : 'ok', {
      status: attempts < 3 ? 503 : 200,
      headers: {'content-type': 'text/plain'},
    });
  };
  const response = await fetchWithRetry('https://docs.certi.life/robots.txt', {fetchImpl, retries: 3, delayMs: 0});
  assert.equal(response.status, 200);
  assert.equal(attempts, 3);
});

test('verifyResponse는 URL·expected·actual이 포함된 실패를 만든다', async () => {
  const response = new Response('wrong', {status: 200, headers: {'content-type': 'text/html'}});
  await assert.rejects(
    verifyResponse('https://docs.certi.life/robots.txt', response, {status: 200, contentType: 'text/plain', body: 'expected'}),
    /URL=https:\/\/docs\.certi\.life\/robots\.txt expected=content-type text\/plain actual=text\/html/,
  );
});

test('verifyResponse는 byte-exact body drift를 명확히 거부한다', async () => {
  const response = new Response('wrong', {status: 200, headers: {'content-type': 'text/plain'}});
  await assert.rejects(
    verifyResponse('https://docs.certi.life/llms.txt', response, {status: 200, contentType: 'text/plain', body: 'expected'}),
    /URL=https:\/\/docs\.certi\.life\/llms\.txt expected=body sha256 [a-f0-9]{64} actual=[a-f0-9]{64}/,
  );
});

test('fetchWithRetry는 영구 404를 재시도하지 않고 그대로 반환한다', async () => {
  let attempts = 0;
  const response = await fetchWithRetry('https://docs.certi.life/missing', {
    fetchImpl: async () => { attempts += 1; return new Response('missing', {status: 404}); },
    retries: 3,
    delayMs: 0,
  });
  assert.equal(response.status, 404);
  assert.equal(attempts, 1);
});

test('fetchWithRetry는 Retry-After가 있는 429를 제한적으로 재시도한다', async () => {
  let attempts = 0;
  const response = await fetchWithRetry('https://docs.certi.life/robots.txt', {
    fetchImpl: async () => {
      attempts += 1;
      return new Response(attempts === 1 ? 'rate limited' : 'ok', {
        status: attempts === 1 ? 429 : 200,
        headers: attempts === 1 ? {'retry-after': '0'} : {'content-type': 'text/plain'},
      });
    },
    retries: 2,
    delayMs: 0,
  });
  assert.equal(response.status, 200);
  assert.equal(attempts, 2);
});

test('fetchWithRetry는 Retry-After 없는 429와 network error도 제한적으로 재시도한다', async () => {
  let rateAttempts = 0;
  const rateResponse = await fetchWithRetry('https://docs.certi.life/robots.txt', {
    fetchImpl: async () => {
      rateAttempts += 1;
      return new Response(rateAttempts === 1 ? 'rate limited' : 'ok', {status: rateAttempts === 1 ? 429 : 200});
    },
    retries: 2,
    delayMs: 0,
  });
  assert.equal(rateResponse.status, 200);
  assert.equal(rateAttempts, 2);

  let networkAttempts = 0;
  const networkResponse = await fetchWithRetry('https://docs.certi.life/robots.txt', {
    fetchImpl: async () => {
      networkAttempts += 1;
      if (networkAttempts === 1) throw new TypeError('temporary network error');
      return new Response('ok', {status: 200});
    },
    retries: 2,
    delayMs: 0,
  });
  assert.equal(networkResponse.status, 200);
  assert.equal(networkAttempts, 2);
});

test('HTML 검증은 서로 무관한 canonical·JSON-LD 문자열 우회를 거부한다', () => {
  const url = 'https://docs.certi.life/guide/help/troubleshooting';
  const fake = `<html><body><div>rel=canonical</div><a href=${url}>not canonical</a><h1>문제 해결</h1><p>TechArticle BreadcrumbList</p></body></html>`;
  assert.throws(() => validateHtmlBody(url, '문제 해결', fake), /canonical/);
});

test('HTML 검증은 실제 canonical·H1·TechArticle·BreadcrumbList의 연결 의미를 확인한다', () => {
  const url = 'https://docs.certi.life/guide/help/troubleshooting';
  const articleExpected = {description: '공식 로그인 문제를 점검합니다.', dateModified: '2026-07-31T02:04:46.000Z'};
  const article = {'@context': 'https://schema.org', '@type': 'TechArticle', headline: '문제 해결', url, mainEntityOfPage: url, inLanguage: 'ko-KR', ...articleExpected};
  const breadcrumbs = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{'@type': 'ListItem', position: 1, name: '문제 해결', item: url}]};
  const html = `<html><head><link rel="canonical" href="${url}"><script type="application/ld+json">${JSON.stringify(article)}</script><script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script></head><body><h1>문제 해결</h1></body></html>`;
  assert.doesNotThrow(() => validateHtmlBody(url, '문제 해결', html, '문제 해결', articleExpected));
  assert.throws(() => validateHtmlBody(url, '다른 제목', html, '문제 해결', articleExpected), /H1/);
  const malformedBreadcrumb = {'@type': 'BreadcrumbList', itemListElement: [{name: '문제 해결', item: url}]};
  const malformed = html.replace(JSON.stringify(breadcrumbs), JSON.stringify(malformedBreadcrumb));
  assert.throws(() => validateHtmlBody(url, '문제 해결', malformed, '문제 해결', articleExpected), /BreadcrumbList/);
  const incompleteArticle = {...article};
  delete incompleteArticle.description;
  assert.throws(() => validateHtmlBody(url, '문제 해결', html.replace(JSON.stringify(article), JSON.stringify(incompleteArticle)), '문제 해결', articleExpected), /TechArticle/);
  const nestedFaq = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify({'@context': 'https://schema.org', '@graph': [{'@type': 'FAQPage'}]})}</script></head>`);
  assert.throws(() => validateHtmlBody(url, '문제 해결', nestedFaq, '문제 해결', articleExpected), /FAQPage/);
});

test('production verifier는 artifact에 없는 제목을 MDX frontmatter에서 읽는다', () => {
  assert.equal(loadDocTitle(projectRoot, 'intro'), '더 신뢰받는 병원 경험을 만듭니다');
  assert.equal(loadDocNavigationTitle(projectRoot, 'intro'), 'CertiLife 소개');
  assert.equal(loadDocTitle(projectRoot, 'help/troubleshooting'), '문제 해결');
});
