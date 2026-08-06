import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  createCleanMarkdownArtifacts,
  renderCleanMarkdown,
  verifyCleanMarkdownArtifacts,
  writeCleanMarkdownArtifacts,
} from './clean-markdown.mjs';
import {cleanMarkdownUrl, renderLlmsTxt} from './generate-ai-discovery.mjs';
import {assertNoEvaluationRegression} from './evaluate-clean-markdown.mjs';

const routes = new Map([
  ['getting-started/intro', {url: 'https://docs.certi.life/guide/getting-started/intro', fragments: new Set(['시작'])}],
  ['help/faq', {url: 'https://docs.certi.life/guide/help/faq', fragments: new Set(['자주-묻는-질문'])}],
]);

test('renderCleanMarkdown는 frontmatter·ESM·주석·JSX를 제거하고 의미와 링크·코드를 보존한다', () => {
  const source = `---
title: 시작 안내
description: 첫 단계 공개 안내입니다.
slug: /internal-route
sidebar_position: 1
---
import Card from '@site/src/components/Card';

# 시작 안내

{/* 편집 메모 */}

## 시작

[FAQ](../help/faq#자주-묻는-질문)를 확인하세요.

:::caution[주의]
개인정보를 넣지 마세요.
:::

\`\`\`js title="example"
console.log('safe');
\`\`\`
`;
  const output = renderCleanMarkdown(source, {
    id: 'getting-started/intro',
    canonicalUrl: routes.get('getting-started/intro').url,
    routeMap: routes,
  });
  assert.match(output, /^# 시작 안내$/m);
  assert.equal((output.match(/^# /gm) ?? []).length, 1);
  assert.match(output, /^> 첫 단계 공개 안내입니다\.$/m);
  assert.match(output, /\[사람이 읽는 원문\]\(https:\/\/docs\.certi\.life\/guide\/getting-started\/intro\)/);
  assert.match(output, /\[FAQ\]\(https:\/\/docs\.certi\.life\/guide\/help\/faq#자주-묻는-질문\)/);
  assert.match(output, /^> \*\*주의\*\*$/m);
  assert.match(output, /```js title="example"\nconsole\.log\('safe'\);\n```/);
  assert.doesNotMatch(output, /frontmatter|sidebar_position|import Card|<Card>|\{\/\*|:::/);
});

test('renderCleanMarkdown는 본문 H1이 frontmatter 제목과 다르면 H2로 보존한다', () => {
  const output = renderCleanMarkdown(`---\ntitle: 공식 제목\ndescription: 설명입니다.\n---\n# 의미 있는 본문 제목\n`, {
    id: 'getting-started/intro', canonicalUrl: routes.get('getting-started/intro').url, routeMap: routes,
  });
  assert.equal((output.match(/^# /gm) ?? []).length, 1);
  assert.match(output, /^## 의미 있는 본문 제목$/m);
});

test('renderCleanMarkdown는 paired MDX를 명시적으로 처리하고 Tabs의 label·경계를 보존한다', () => {
  const options = {id: 'getting-started/intro', canonicalUrl: routes.get('getting-started/intro').url, routeMap: routes};
  const wrap = (body) => `---\ntitle: 시작 안내\ndescription: 설명입니다.\n---\n${body}\n`;
  assert.throws(() => renderCleanMarkdown(wrap('<Card>중요 내용</Card>'), options), /unknown paired MDX component: Card/);
  assert.throws(() => renderCleanMarkdown(wrap('<Tabs><TabItem label={dynamic}>내용</TabItem></Tabs>'), options), /TabItem: label must be a literal string/);
  assert.throws(
    () => renderCleanMarkdown(wrap('<Tabs><TabItem label="외부" value="outer"><Tabs><TabItem label="내부" value="inner">내용</TabItem></Tabs></TabItem></Tabs>'), options),
    /nested Tabs cannot be preserved safely/,
  );

  const output = renderCleanMarkdown(wrap(`<Tabs>
<TabItem value="hospital" label="병원">
병원 절차입니다.
</TabItem>
<TabItem value="manufacturer" label="제조사">
제조사 절차입니다.
</TabItem>
</Tabs>`), options);
  assert.match(output, /^## 병원$/m);
  assert.match(output, /^병원 절차입니다\.$/m);
  assert.match(output, /^## 제조사$/m);
  assert.match(output, /^제조사 절차입니다\.$/m);
  assert.ok(output.indexOf('## 병원') < output.indexOf('병원 절차입니다.'));
  assert.ok(output.indexOf('병원 절차입니다.') < output.indexOf('## 제조사'));
  assert.ok(output.indexOf('## 제조사') < output.indexOf('제조사 절차입니다.'));
});

test('renderCleanMarkdown는 의미를 증명할 수 없는 MDX와 위험·깨진 링크를 fail-closed로 거부한다', () => {
  const options = {id: 'getting-started/intro', canonicalUrl: routes.get('getting-started/intro').url, routeMap: routes};
  const wrap = (body) => `---\ntitle: 시작 안내\ndescription: 설명입니다.\n---\n${body}\n`;
  assert.throws(() => renderCleanMarkdown(wrap('<Widget />'), options), /self-closing MDX component/);
  assert.throws(() => renderCleanMarkdown(wrap('{dynamicValue}'), options), /MDX expression/);
  assert.throws(() => renderCleanMarkdown(wrap(':::unknown\n내용\n:::'), options), /unknown directive/);
  assert.throws(() => renderCleanMarkdown(wrap('[누락](../help/missing)'), options), /unknown internal link target/);
  assert.throws(() => renderCleanMarkdown(wrap('[위험](javascript:alert(1))'), options), /dangerous link scheme/);
  assert.throws(() => renderCleanMarkdown(wrap('[메일](mailto:test@example.com)'), options), /unsupported link scheme/);
  assert.throws(() => renderCleanMarkdown(wrap('[누락 절](../help/faq#없는-절)'), options), /missing fragment/);
});

test('artifact writer는 모든 path를 선검증하고 traversal·absolute·encoded·platform separator 실패를 원자적으로 처리한다', () => {
  const snapshot = (directory) => {
    if (!existsSync(directory)) return null;
    return readdirSync(directory, {withFileTypes: true})
      .sort((left, right) => left.name.localeCompare(right.name, 'en'))
      .map((entry) => [entry.name, entry.isDirectory() ? snapshot(join(directory, entry.name)) : readFileSync(join(directory, entry.name), 'utf8')]);
  };
  const maliciousPaths = [
    'guide/../../escaped.txt',
    '/tmp/absolute.md',
    'C:\\absolute.md',
    'guide/%2e%2e/escaped.md',
    'guide/%252e%252e/escaped.md',
    'guide/safe%2f..%2fescaped.md',
    'guide\\..\\escaped.md',
  ];

  for (const path of maliciousPaths) {
    const root = mkdtempSync(join(tmpdir(), 'clean-markdown-path-test-'));
    mkdirSync(join(root, 'static', 'guide'), {recursive: true});
    writeFileSync(join(root, 'static', 'guide', 'existing.md'), 'stable\n');
    const before = snapshot(root);
    assert.throws(
      () => writeCleanMarkdownArtifacts(root, [
        {path: 'guide/valid.md', content: 'new\n'},
        {path, content: 'escape\n'},
      ]),
      /invalid clean Markdown artifact path/,
      path,
    );
    assert.deepEqual(snapshot(root), before, `${path} must not change anything under the project root`);
    assert.equal(existsSync(join(root, 'escaped.txt')), false, `${path} must not escape the staging root`);
  }
});

test('artifact writer는 case·Unicode normalization 충돌을 쓰기 전에 fail-closed로 거부한다', () => {
  const snapshot = (directory) => readdirSync(directory, {withFileTypes: true})
    .sort((left, right) => left.name.localeCompare(right.name, 'en'))
    .map((entry) => [entry.name, entry.isDirectory() ? snapshot(join(directory, entry.name)) : readFileSync(join(directory, entry.name), 'utf8')]);
  const collisions = [
    ['guide/A.md', 'guide/a.md'],
    ['guide/café.md', `guide/cafe\u0301.md`],
    ['guide/s.md', 'guide/ſ.md'],
    ['guide/strasse.md', 'guide/straße.md'],
    ['guide/σ.md', 'guide/ς.md'],
  ];

  for (const [first, second] of collisions) {
    const root = mkdtempSync(join(tmpdir(), 'clean-markdown-collision-test-'));
    mkdirSync(join(root, 'static', 'guide'), {recursive: true});
    writeFileSync(join(root, 'static', 'guide', 'existing.md'), 'stable\n');
    const before = snapshot(root);
    assert.throws(
      () => writeCleanMarkdownArtifacts(root, [
        {path: first, content: 'first\n'},
        {path: second, content: 'second\n'},
      ]),
      /colliding clean Markdown artifact path/,
    );
    assert.deepEqual(snapshot(root), before);
  }
});

test('clean Markdown artifacts는 canonical route와 1:1로 생성되고 stale·orphan·build drift를 거부한다', () => {
  const source = (title) => `---\ntitle: ${title}\ndescription: 공개 설명입니다.\n---\n# ${title}\n\n## 절\n\n본문입니다.\n`;
  const artifacts = createCleanMarkdownArtifacts([
    {id: 'intro', canonicalUrl: 'https://docs.certi.life/guide/intro', source: source('소개')},
    {id: 'help/faq', canonicalUrl: 'https://docs.certi.life/guide/help/faq', source: source('FAQ')},
  ]);
  assert.deepEqual(artifacts.map(({path}) => path), ['guide/help/faq.md', 'guide/intro.md']);
  const root = mkdtempSync(join(tmpdir(), 'clean-markdown-test-'));
  writeCleanMarkdownArtifacts(root, artifacts);
  assert.doesNotThrow(() => verifyCleanMarkdownArtifacts(root, artifacts));

  writeFileSync(join(root, 'static', artifacts[0].path), 'stale\n');
  assert.throws(() => verifyCleanMarkdownArtifacts(root, artifacts), /stale clean Markdown artifact/);
  writeCleanMarkdownArtifacts(root, artifacts);
  writeFileSync(join(root, 'static', 'guide', 'orphan.md'), 'orphan\n');
  assert.throws(() => verifyCleanMarkdownArtifacts(root, artifacts), /orphan clean Markdown artifact/);

  writeCleanMarkdownArtifacts(root, artifacts);
  for (const artifact of artifacts) {
    const built = join(root, 'build', artifact.path);
    mkdirSync(join(built, '..'), {recursive: true});
    writeFileSync(built, artifact.content);
  }
  assert.doesNotThrow(() => verifyCleanMarkdownArtifacts(root, artifacts, {buildRoot: join(root, 'build')}));
  writeFileSync(join(root, 'build', artifacts[0].path), 'drift\n');
  assert.throws(() => verifyCleanMarkdownArtifacts(root, artifacts, {buildRoot: join(root, 'build')}), /built clean Markdown artifact differs/);
});

test('llms.txt는 human canonical 대신 각 clean Markdown endpoint를 상세 문서 링크로 사용한다', () => {
  assert.equal(cleanMarkdownUrl('intro'), 'https://docs.certi.life/guide/intro.md');
  const llms = renderLlmsTxt();
  assert.match(llms, /\(https:\/\/docs\.certi\.life\/guide\/intro\.md\)/);
  assert.doesNotMatch(llms, /\(https:\/\/docs\.certi\.life\/guide\/intro\):/);
});

test('clean Markdown retrieval 평가는 기준선 회귀를 fail-closed로 거부한다', () => {
  const source = {top1Accuracy: 0.9, top3Accuracy: 1, evidencePassRate: 1, safetyPassRate: 1, prohibitedClaimPassRate: 1};
  assert.doesNotThrow(() => assertNoEvaluationRegression(source, {...source}));
  assert.throws(() => assertNoEvaluationRegression(source, {...source, top1Accuracy: 0.8}), /top1Accuracy regressed/);
  assert.throws(() => assertNoEvaluationRegression(source, {...source, safetyPassRate: 0.9}), /safetyPassRate regressed/);
});

test('credential scanner는 대표 secret을 차단하고 안전한 설명·placeholder는 허용한다', () => {
  const document = (body) => [{
    id: 'security',
    canonicalUrl: 'https://docs.certi.life/guide/security',
    source: `---\ntitle: 보안 안내\ndescription: 공개 설명입니다.\n---\n${body}\n`,
  }];
  const deeplyEncodedAssignment = Array.from({length: 65}).reduce(
    (value) => encodeURIComponent(value),
    'token=live-secret-value',
  );
  const leaked = [
    `AWS 키: ${'AKIA'}${'Z3N7Q5J2M8R4T6VU'}`,
    `임시 AWS 키: ${'ASIA'}${'Q7W2E9R4T6Y8U1IO'}`,
    `GitHub token: ${'ghp_'}${'abcdefghijklmnopqrstuvwxyz1234567890'}`,
    `Fine-grained token: ${'github_pat_'}${'11ABCDEFG0123456789_abcdefghijklmnopqrstuvwxyz'}`,
    'password: "S3cure-example-credential!"',
    'passwd = another-secret-value-123',
    'password/**/: comment-smuggled-secret-value-123',
    'token/*=comment-smuggled-secret-value-123',
    'password/*=comment-smuggled-secret-value-123',
    'db_password = database-secret-value-123',
    'user-passwd = account-secret-value-123',
    'password: REPLACE_ME live-secret-value-123',
    'password: "REPLACE_/*live-secret*/ME"',
    'password: "<YOUR_/*live-secret*/PASSWORD>"',
    'password: "REPLACE_ME"live-secret-value-123',
    'token: "REDACTED live-secret-value-123"',
    'token: \\"REDACTED live-secret-value-123\\"',
    'token: "<YOUR_TOKEN> live-secret-value-123"',
    'token: "PLACEHOLDER live-secret-value-123"',
    'token: replace_me',
    'token: <your_token>',
    'token: *',
    'token: **',
    'token: ****',
    "authorization = '*** live-secret-value-123'",
    '"token": "live-secret-value-123"',
    '\\"token\\": \\"live-secret-value-123\\"',
    'Authorization: Bearer <YOUR_TOKEN>live-secret-value-123',
    'password += compound-secret-value-123',
    'dbPassword = compound-secret-value-123',
    'clientSecret = compound-secret-value-123',
    'accessToken = compound-secret-value-123',
    'authorizationToken = compound-secret-value-123',
    'pass**word**: compound-secret-value-123',
    'pass`word`: compound-secret-value-123',
    String.raw`pass\word: compound-secret-value-123`,
    String.raw`pass\\word: compound-secret-value-123`,
    String.raw`api\_key: compound-secret-value-123`,
    String.raw`api\\_key: compound-secret-value-123`,
    'client**_secret**: compound-secret-value-123',
    'auth**orization** = compound-secret-value-123',
    'password /*x*/ ** /*y*/ = compound-secret-value-123',
    'password * * = compound-secret-value-123',
    'password ? ? = compound-secret-value-123',
    'password > > > = compound-secret-value-123',
    'password | | = compound-secret-value-123',
    'password & & = compound-secret-value-123',
    'pass\u200Bword = compound-secret-value-123',
    'api\u2060Key = compound-secret-value-123',
    'db_pwd ??= compound-secret-value-123',
    'client_/* split */secret += comment-compound-secret-123',
    'proxy-authorization ??= compound-secret-value-123',
    'client_secret = client-secret-value-123456',
    'access_token = access-token-value-123456',
    '**password**: "formatted-secret-value-123"',
    '**API key**: formatted-api-value-123456',
    '`client_secret`: inline-code-secret-value-123',
    '[api_key](https://example.com/credentials): linked-secret-value-123',
    `api_key: ${'sk_live_'}${'example_1234567890abcdef'}`,
    `Authorization: Bearer ${'eyJhbGciOiJIUzI1NiJ9'}${'.synthetic.signature'}`,
    `${'-----BEGIN PRIVATE KEY-----'}\nZmFrZS1wcml2YXRlLWtleS1tYXRlcmlhbA==\n${'-----END PRIVATE KEY-----'}`,
    '[encoded query](https://docs.certi.life/guide/help?token%3Dlive-secret-value)',
    '[encoded path](https://docs.certi.life/guide/token%3Dlive-secret-value)',
    '[double encoded fragment](https://docs.certi.life/guide/help#token%253Dlive-secret-value)',
    '[malformed encoded query](https://docs.certi.life/guide/help?token%3Dlive-secret-value%ZZ)',
    '[malformed field separator](https://docs.certi.life/guide/help?token%ZZ%3Dlive-secret-value)',
    '[malformed field prefix](https://docs.certi.life/guide/%ZZtoken%3Dlive-secret-value)',
    '[malformed zero-width prefix](https://docs.certi.life/guide/help?q=%ZZto%E2%80%8Bken%3Dlive-secret-value)',
    '[malformed zero-width separator](https://docs.certi.life/guide/help?to%E2%80%8Bken%ZZ%3Dlive-secret-value)',
    "[apostrophe path](https://docs.certi.life/guide/pre'token%3Dlive-secret-value)",
    '[encoded zero width](https://docs.certi.life/guide/help?to%E2%80%8Bken%3Dlive-secret-value)',
    '[malformed encoded zero width](https://docs.certi.life/guide/help?to%E2%80%8Bken%3Dlive-secret-value%ZZ)',
    '[balanced parenthesis credential](https://docs.certi.life/guide/(safe)?to%E2%80%8Bken%3Dlive-secret-value)',
    '[escaped closing parenthesis credential](https://docs.certi.life/guide/a\\)token%3Dlive-secret-value)',
    String.raw`[escaped quote credential](https://docs.certi.life/guide/a\"token%3Dlive-secret-value)`,
    String.raw`[escaped angle credential](https://docs.certi.life/guide/a\>token%3Dlive-secret-value)`,
    String.raw`URL https://docs.certi.life/guide/safe\ 010-1234-5678 end`,
    `URL https://docs.certi.life/guide/safe\\${String.fromCodePoint(0x85)}010-1234-5678 end`,
    '[escaped backtick credential](https://docs.certi.life/guide/a\\`token%3Dlive-secret-value)',
    '[mixed malformed zero width](https://docs.certi.life/guide/help?to%E2%80%8Bken%3Dlive-secret-value%ZZ%E0%A4%A)',
    `[excessive encoding](https://docs.certi.life/guide/help?q=${deeplyEncodedAssignment})`,
  ];
  for (const body of leaked) {
    assert.throws(() => createCleanMarkdownArtifacts(document(body)), /private or credential-like content detected/, body);
  }

  const safe = [
    'API key와 password는 공개 문서에 입력하지 마세요.',
    'API key: REPLACE_ME',
    '`API_KEY=<YOUR_API_KEY>`',
    '`client_secret=${CLIENT_SECRET}`',
    '`password=REPLACE_ME`',
    'password: REPLACE_ME.',
    'token: REDACTED.',
    '"token": "REDACTED".',
    'token: "PLACEHOLDER"를 사용합니다.',
    'token: PLACEHOLDER。',
    '`token: "<YOUR_TOKEN>"`을 입력합니다.',
    '`token: <YOUR_TOKEN>!`',
    '`db_password=<YOUR_PASSWORD>`',
    'Authorization: Bearer ***',
    '`Authorization: Bearer <YOUR_TOKEN>.`',
    '[공개 정책](https://example.com/123e4567e89b12d3a456426614174000)',
    '[공개 연락처](https://example.com/02.1234.5678)',
    '[공개 IPv4](https://1.1.1.1/)',
    '[공개 IPv6](https://[2606:4700:4700::1111]/)',
    '[encoded percent](https://docs.certi.life/guide/discount%25)',
    '[balanced parenthesis](https://docs.certi.life/guide/(overview)?q=ok)',
    '[escaped parenthesis](https://docs.certi.life/guide/a\\(b\\)?q=ok)',
    '**password**: REPLACE_ME',
    'password: REPLACE_ME, api_key: PLACEHOLDER',
    'CSS --token: primary-blue',
    'CSS design_token: primary-blue',
    'CSS custom_token: primary-blue',
    '비밀번호는 공개 문서에 입력하지 마세요.',
    `실제 개인 키 블록은 \`${'-----BEGIN PRIVATE KEY-----'}\`로 시작합니다.`,
  ];
  for (const [index, body] of safe.entries()) {
    assert.doesNotThrow(() => createCleanMarkdownArtifacts(document(body)), `safe[${index}] ${body}`);
  }
});

test('credential scanner는 공개 Markdown의 UUID·전화번호·내부 주소를 차단한다', () => {
  const document = (body) => [{
    id: 'security',
    canonicalUrl: 'https://docs.certi.life/guide/security',
    source: `---\ntitle: 보안 안내\ndescription: 공개 설명입니다.\n---\n${body}\n`,
  }];
  for (const body of [
    '식별자 123e4567e89b12d3a456426614174000',
    '연락처 02.1234.5678',
    '연락처 070.1234.5678',
    '연락처 +82.70.1234.5678',
    '내부 주소 fd00::1',
    '[내부 주소](http://[fd00::1]/)',
  ]) {
    assert.throws(() => createCleanMarkdownArtifacts(document(body)), /private or credential-like content detected/, body);
  }
});

test('clean Markdown artifacts는 duplicate route와 identical output을 fail-closed로 거부한다', () => {
  const source = `---\ntitle: 동일\ndescription: 공개 설명입니다.\n---\n# 동일\n`;
  assert.throws(() => createCleanMarkdownArtifacts([
    {id: 'a', canonicalUrl: 'https://docs.certi.life/guide/a', source},
    {id: 'b', canonicalUrl: 'https://docs.certi.life/guide/a', source},
  ]), /duplicate clean Markdown endpoint/);
  assert.throws(() => createCleanMarkdownArtifacts([
    {id: 'a', canonicalUrl: 'https://docs.certi.life/guide/a', source},
    {id: 'b', canonicalUrl: 'https://docs.certi.life/guide/b', source},
  ]), /identical clean Markdown output/);
});
