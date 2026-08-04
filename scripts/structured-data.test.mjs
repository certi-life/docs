import assert from 'node:assert/strict';
import test from 'node:test';
import {buildTechArticle} from '../src/utils/docStructuredData.mjs';
import {validateFreshnessRecords} from './structured-data-check.mjs';
import {jsonLdHasType, normalizeJsonLd, validateBreadcrumbList, validateTechArticle} from './structured-data-validation.mjs';

test('TechArticle은 화면 메타데이터와 git lastUpdatedAt만 사용해 결정론적으로 생성된다', () => {
  const input = {
    title: '문제 해결',
    description: '공식 로그인 문제를 점검합니다.',
    permalink: '/guide/help/troubleshooting',
    lastUpdatedAt: Date.parse('2026-07-31T02:04:46.000Z'),
    siteUrl: 'https://docs.certi.life',
  };
  const first = buildTechArticle(input);
  assert.deepEqual(first, buildTechArticle(input));
  assert.equal(first['@type'], 'TechArticle');
  assert.equal(first.headline, input.title);
  assert.equal(first.description, input.description);
  assert.equal(first.url, 'https://docs.certi.life/guide/help/troubleshooting');
  assert.equal(first.dateModified, '2026-07-31T02:04:46.000Z');
  assert.equal(first.inLanguage, 'ko-KR');
  assert.equal('datePublished' in first, false);
  assert.equal(JSON.stringify(first).includes('FAQPage'), false);
});

test('TechArticle은 git 변경 시각이 없거나 URL이 사이트 밖이면 fail-closed한다', () => {
  const base = {title: '제목', description: '설명', permalink: '/guide/a', siteUrl: 'https://docs.certi.life'};
  assert.throws(() => buildTechArticle({...base, lastUpdatedAt: undefined}), /lastUpdatedAt/);
  assert.throws(() => buildTechArticle({...base, lastUpdatedAt: Number.NaN}), /lastUpdatedAt/);
  assert.throws(() => buildTechArticle({...base, lastUpdatedAt: 1, permalink: 'https://evil.example/a'}), /permalink/);
});

test('freshness gate는 빌드 현재시각·미래 날짜·모든 문서 동일 날짜를 거부한다', () => {
  const expected = new Map([
    ['https://docs.certi.life/guide/a', '2026-07-30'],
    ['https://docs.certi.life/guide/b', '2026-07-31'],
  ]);
  assert.doesNotThrow(() => validateFreshnessRecords([
    {loc: 'https://docs.certi.life/guide/a', lastmod: '2026-07-30'},
    {loc: 'https://docs.certi.life/guide/b', lastmod: '2026-07-31'},
  ], expected, new Date('2026-08-05T00:00:00Z')));
  assert.throws(() => validateFreshnessRecords([
    {loc: 'https://docs.certi.life/guide/a', lastmod: '2026-08-05'},
    {loc: 'https://docs.certi.life/guide/b', lastmod: '2026-08-05'},
  ], expected, new Date('2026-08-05T00:00:00Z')), /expected|identical/);
  assert.throws(() => validateFreshnessRecords([
    {loc: 'https://docs.certi.life/guide/a', lastmod: '2026-08-06'},
    {loc: 'https://docs.certi.life/guide/b', lastmod: '2026-07-31'},
  ], expected, new Date('2026-08-05T00:00:00Z')), /future/);
});

test('공통 BreadcrumbList gate는 schema.org 문맥·연속 ListItem·최종 navigation title을 fail-closed 검증한다', () => {
  const url = 'https://docs.certi.life/guide/help/troubleshooting';
  const valid = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    {'@type': 'ListItem', position: 1, name: '문제 해결', item: url},
  ]};
  assert.doesNotThrow(() => validateBreadcrumbList(valid, {url, navigationTitle: '문제 해결'}));
  for (const malformed of [
    {...valid, '@context': 'http://schema.org'},
    {...valid, itemListElement: []},
    {...valid, itemListElement: [
      {'@type': 'ListItem', position: 1, name: '도움말', item: 'https://docs.certi.life/guide/help'},
      {'@type': 'ListItem', position: 2, name: '문제 해결', item: url},
    ]},
    {...valid, itemListElement: [{...valid.itemListElement[0], '@type': 'Thing'}]},
    {...valid, itemListElement: [{...valid.itemListElement[0], item: undefined}]},
    {...valid, itemListElement: [{...valid.itemListElement[0], position: 2}]},
    {...valid, itemListElement: [{...valid.itemListElement[0], name: '   '}]},
    {...valid, itemListElement: [{...valid.itemListElement[0], name: '다른 제목'}]},
  ]) {
    assert.throws(() => validateBreadcrumbList(malformed, {url, navigationTitle: '문제 해결'}), /BreadcrumbList/);
  }
});

test('공통 JSON-LD gate는 배열·@graph를 평탄화하고 완전한 TechArticle만 허용한다', () => {
  const expected = {
    title: '문제 해결',
    description: '공식 로그인 문제를 점검합니다.',
    url: 'https://docs.certi.life/guide/help/troubleshooting',
    dateModified: '2026-07-31T02:04:46.000Z',
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: expected.title,
    description: expected.description,
    url: expected.url,
    mainEntityOfPage: expected.url,
    inLanguage: 'ko-KR',
    dateModified: expected.dateModified,
  };
  assert.doesNotThrow(() => validateTechArticle(article, expected));
  for (const field of ['@context', 'headline', 'description', 'url', 'mainEntityOfPage', 'inLanguage', 'dateModified']) {
    const malformed = {...article};
    delete malformed[field];
    assert.throws(() => validateTechArticle(malformed, expected), /TechArticle/);
  }
  const faq = {'@type': 'FAQPage'};
  assert.ok(normalizeJsonLd([{'@context': 'https://schema.org', '@graph': [[faq]]}]).includes(faq));
  assert.equal(jsonLdHasType({'@type': ['Thing', 'FAQPage']}, 'FAQPage'), true);
});
