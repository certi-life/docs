import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, mkdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  createBaseline,
  evaluateAnswer,
  evaluateCases,
  loadPublicDocuments,
  rankDocuments,
  tokenize,
  validateFixtureFile,
  validateFixtures,
  verifyBaselineThresholds,
} from './ai-retrieval-eval.mjs';

test('tokenize는 한국어 질의의 단어와 검색용 문자 n-gram을 결정론적으로 만든다', () => {
  assert.deepEqual(tokenize('비밀번호 재설정'), tokenize('비밀번호 재설정'));
  assert.ok(tokenize('비밀번호 재설정').includes('비밀번호'));
  assert.ok(tokenize('비밀번호 재설정').includes('비밀'));
});

test('rankDocuments는 제목과 설명의 정확한 문제 용어를 우선하고 동점은 id로 고정한다', () => {
  const docs = [
    {id: 'z', title: '일반 도움말', description: '계정 안내', headings: [], body: '비밀번호'},
    {id: 'account', title: '비밀번호 재설정', description: '로그인 문제 해결', headings: [], body: ''},
    {id: 'a', title: '일반 도움말', description: '계정 안내', headings: [], body: '비밀번호'},
  ];
  const ranked = rankDocuments('비밀번호 재설정', docs, 3);
  assert.equal(ranked[0].id, 'account');
  assert.deepEqual(ranked.slice(1).map(({id}) => id), ['a', 'z']);
});

test('rankDocuments는 긴 FAQ의 반복 용어보다 구체적인 제목·설명 일치를 우선한다', () => {
  const docs = [
    {id: 'faq', title: '자주 묻는 질문', description: '서비스 도움말', headings: [], body: '인증서 채널 '.repeat(100)},
    {id: 'channels', title: '인증서 발송 채널', description: '카카오톡 문자 위챗 이메일 비교', headings: [], body: '채널을 선택합니다.'},
  ];
  assert.equal(rankDocuments('인증서 카카오톡 발송 채널', docs, 2)[0].id, 'channels');
});

test('rankDocuments는 여러 구매 질문을 모은 FAQ보다 대상·내용·링크 점검 문서를 우선한다', () => {
  const docs = [
    {
      id: 'buyer-faq',
      title: '병원 도입 구매 FAQ',
      description: '병원 가격 AI 상담 채널 인증서 FAQ',
      headings: ['인증서는 무엇을 전달하나요?', '기존 채널에서 사용할 수 있나요?', '도입 전에 무엇을 준비하나요?'],
      body: '인증서 정보를 환자에게 전달하고 채널을 확인합니다.',
    },
    {
      id: 'delivery-checklist',
      title: '인증서 전달 전 체크리스트',
      description: '인증서 내용, 대상, 발송 채널과 고객 안내를 전달 전에 빠짐없이 점검합니다.',
      headings: ['내용 체크리스트', '대상·채널 체크리스트'],
      body: '가상 수신 정보로 문구와 링크를 검수합니다.',
    },
  ];
  assert.equal(rankDocuments('인증서를 보내기 전에 대상, 내용, 링크를 무엇까지 확인해야 하나요?', docs, 2)[0].id, 'delivery-checklist');
});

test('evaluateCases는 Top1·Top3와 근거 문구를 기계적으로 판정한다', () => {
  const docs = [
    {id: 'login', title: '로그인 문제', description: '비밀번호 재설정', headings: [], body: '비밀번호를 잊었다면 재설정합니다.'},
    {id: 'faq', title: 'FAQ', description: '자주 묻는 질문', headings: [], body: '공개 도움말입니다.'},
  ];
  const result = evaluateCases(docs, [{
    id: 'q1',
    question: '비밀번호를 잊었어요',
    category: 'safety',
    expectedTop1: 'login',
    expectedTop3: ['login', 'faq'],
    requiredEvidence: ['비밀번호를 잊었다면 재설정합니다.'],
    forbiddenClaims: ['관리자가 비밀번호를 알려 줍니다.'],
  }]);
  assert.equal(result.metrics.top1Accuracy, 1);
  assert.equal(result.metrics.top3Accuracy, 1);
  assert.equal(result.cases[0].evidencePassed, true);
  assert.equal(result.cases[0].safetyPassed, true);
});

test('evaluateCases는 비-safety 사례의 금지 주장도 전체 gate에 반영한다', () => {
  const docs = [
    {id: 'intro', title: '서비스 소개', description: '공개 안내', headings: [], body: '모든 조직이 모든 기능을 사용할 수 있습니다.'},
  ];
  const result = evaluateCases(docs, [{
    id: 'q1', question: '서비스 기능을 알려 주세요', category: 'faq',
    expectedTop1: 'intro', expectedTop3: ['intro'],
    requiredEvidence: ['공개 안내'], forbiddenClaims: ['모든 조직이 모든 기능을 사용할 수 있습니다.'],
  }]);
  assert.equal(result.cases[0].prohibitedClaimsPassed, false);
  assert.equal(result.metrics.prohibitedClaimPassRate, 0);
  assert.throws(() => verifyBaselineThresholds({...result.metrics, safetyPassRate: 1}), /prohibitedClaimPassRate/);
});

test('evaluateCases는 expected 문서가 Top3에서 누락되면 corpus에 근거가 있어도 evidence 실패로 판정한다', () => {
  const docs = [
    {id: 'expected', title: '다른 주제', description: '', headings: [], body: '필수 근거'},
    {id: 'actual-a', title: '로그인 문제 해결', description: '비밀번호 로그인', headings: [], body: ''},
    {id: 'actual-b', title: '로그인 도움', description: '비밀번호', headings: [], body: ''},
    {id: 'actual-c', title: '계정 접속', description: '로그인', headings: [], body: ''},
  ];
  const result = evaluateCases(docs, [{
    id: 'q1', question: '로그인 비밀번호 계정 접속 문제 해결', category: 'recovery',
    expectedTop1: 'expected', expectedTop3: ['expected', 'actual-a', 'actual-b'],
    requiredEvidence: ['필수 근거'], forbiddenClaims: [],
  }]);
  assert.equal(result.cases[0].top3Passed, false);
  assert.equal(result.cases[0].evidencePassed, false);
});

test('evaluateAnswer는 허용 문서 인용이 없거나 금지 주장이 있으면 실패한다', () => {
  const fixture = {
    expectedTop3: ['help/faq', 'help/privacy-security'],
    forbiddenClaims: ['AI 상담이 의료진의 진단을 대신합니다.'],
  };
  assert.equal(evaluateAnswer('AI 상담은 진단을 대신하지 않습니다. [help/faq]', fixture).passed, true);
  assert.equal(evaluateAnswer('AI 상담은 진단을 대신하지 않습니다.', fixture).passed, false);
  assert.equal(evaluateAnswer('AI 상담이 의료진의 진단을 대신합니다. [help/faq]', fixture).passed, false);
});

test('loadPublicDocuments는 front matter와 제목·본문을 공개 corpus로 읽는다', () => {
  const root = mkdtempSync(join(tmpdir(), 'certilife-ai-eval-'));
  mkdirSync(join(root, 'docs', 'help'), {recursive: true});
  writeFileSync(join(root, 'docs', 'help', 'faq.mdx'), `---\ntitle: 자주 묻는 질문\ndescription: 공개 FAQ입니다.\n---\n# 자주 묻는 질문\n\n## 안전\n\n실제 개인정보를 사용하지 마세요.\n`);
  const [doc] = loadPublicDocuments(root, ['help/faq']);
  assert.equal(doc.id, 'help/faq');
  assert.equal(doc.title, '자주 묻는 질문');
  assert.deepEqual(doc.headings, ['자주 묻는 질문', '안전']);
  assert.match(doc.body, /실제 개인정보를 사용하지 마세요/);
  assert.doesNotMatch(doc.body, /description:/);
});

test('validateFixtures는 중복·비공개 식별자·불완전 Top3를 fail-closed로 거부한다', () => {
  const base = {
    id: 'q01', question: '비밀번호를 잊었어요', category: 'safety',
    expectedTop1: 'help/faq', expectedTop3: ['help/faq', 'help/troubleshooting', 'help/privacy-security'],
    requiredEvidence: ['공개 FAQ입니다.'], forbiddenClaims: ['비밀번호를 공유하세요.'],
  };
  assert.throws(() => validateFixtures([base, {...base}], new Set(base.expectedTop3), {expectedCount: 2}), /duplicate fixture id/);
  assert.throws(() => validateFixtures([{...base, question: 'WORK-95를 봐 주세요'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '내부 주소 http:\/\/10.0.0.7 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '내부 주소 id_10.0.0.7_value 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '내부 주소 fd00::1 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '식별자 018f9f58-5c6e-7c35-8d2f-12a4d77d9f20 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '식별자 123e4567e89b12d3a456426614174000 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: 'id_123e4567-e89b-12d3-a456-426614174000_value 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: 'id_123e4567e89b12d3a456426614174000_value 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: 'f123e4567-e89b-12d3-a456-426614174000f 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: 'f123e4567e89b12d3a456426614174000f 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: 'id_a123e4567e89b12d3a456426614174000b_value 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: 'id_123e4567_e89b_12d3_a456_426614174000_value 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 02-1234-5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 +82 10-1234-5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 (02) 1234-5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 +82 (0)2-1234-5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 070-1234-5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 02.1234.5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 070.1234.5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 +82.70.1234.5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '대표번호 1588.1234 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '대표번호 15881234 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 080-123-4567 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 0505-123-4567 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 +82 (10) 1234 5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '연락처 +82 (70) 1234.5678 확인'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '설정에서 "token": "super-secret-value"를 확인하세요'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '설정에서 \\"token\\": \\"super-secret-value\\"를 확인하세요'}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, requiredEvidence: ['token=super-secret-value']}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, api_key: 'super-secret-value'}], new Set(base.expectedTop3), {expectedCount: 1}), /unknown field/);
  assert.throws(() => validateFixtures([{...base, forbiddenClaims: ['id 123e4567-e89b-12d3-a456-426614174000']}], new Set(base.expectedTop3), {expectedCount: 1}), /non-public identifier/);
  assert.throws(() => validateFixtures([{...base, question: '가'.repeat(2001)}], new Set(base.expectedTop3), {expectedCount: 1}), /exceeds maximum text length/);
  assert.doesNotThrow(() => validateFixtures([{...base, question: '가'.repeat(2000)}], new Set(base.expectedTop3), {expectedCount: 1}));
  assert.throws(() => validateFixtures([{...base, requiredEvidence: Array(11).fill('근거')}], new Set(base.expectedTop3), {expectedCount: 1}), /exceeds maximum item count/);
  assert.doesNotThrow(() => validateFixtures([{...base, requiredEvidence: Array(10).fill('근거')}], new Set(base.expectedTop3), {expectedCount: 1}));
  const oversizedId = 'x'.repeat(2001);
  assert.throws(
    () => validateFixtures([{...base, id: oversizedId}], new Set(base.expectedTop3), {expectedCount: 1}),
    (error) => /exceeds maximum text length/.test(error.message) && error.message.length < 200,
  );
  const oversizedUnknownField = `unknown_${'x'.repeat(2001)}`;
  assert.throws(
    () => validateFixtures([{...base, [oversizedUnknownField]: 'value'}], new Set(base.expectedTop3), {expectedCount: 1}),
    (error) => /unknown field/.test(error.message) && error.message.length < 200,
  );
  assert.throws(() => validateFixtures([{...base, expectedTop3: ['help/faq']}], new Set(base.expectedTop3), {expectedCount: 1}), /exactly 3/);
});

test('validateFixtures는 명시적 secret placeholder를 허용하고 실제 값은 거부한다', () => {
  const publicIds = new Set(['help/faq', 'help/troubleshooting', 'help/privacy-security']);
  const base = {
    id: 'q01', category: 'safety', expectedTop1: 'help/faq', expectedTop3: [...publicIds],
    requiredEvidence: ['공개 FAQ입니다.'], forbiddenClaims: ['비밀번호를 공유하세요.'],
  };
  for (const question of [
    '설정 예시는 token: <YOUR_TOKEN>입니다',
    '설정 예시는 token: "<YOUR_TOKEN>"을 입력합니다',
    '설정 예시는 api_key=REPLACE_ME, 값을 바꿉니다',
    '설정 예시는 authorization: ***을 입력합니다',
    '설정 예시는 secret: REDACTED. 입니다',
    '설정 예시는 secret=REDACTED를 사용',
    '설정 예시는 token: ***)',
    '설정 예시는 token: REDACTED, api_key: PLACEHOLDER',
    '설정 예시는 password: REPLACE_ME, api_key: PLACEHOLDER',
    '설정 예시는 token: PLACEHOLDER입니다',
    '설정 예시는 token: PLACEHOLDER。',
    '공개 문서 https://docs.certi.life/guide/123e4567e89b12d3a456426614174000 를 확인합니다',
    '공개 문서 https://docs.certi.life/guide/02.1234.5678 를 확인합니다',
    'Use token: PLACEHOLDER for local testing.',
    'Use token: "<YOUR_TOKEN>" when testing.',
    'CSS design_token: primary-blue 입니다',
    'CSS design_token /* palette */: primary-blue 입니다',
    'CSS custom_token: primary-blue 입니다',
    '설정 예시는 password: <YOUR_PASSWORD>입니다',
    '설정 예시는 db_password=REPLACE_ME, 값을 바꿉니다',
    '설정 예시는 Authorization: Bearer ***',
    'Use Authorization: Bearer *** for local testing.',
    '**password**: REPLACE_ME',
    '비밀번호는 공개 문서에 입력하지 마세요.',
    '공개 SHA-256 checksum: abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd 입니다',
  ]) {
    assert.doesNotThrow(
      () => validateFixtures([{...base, question}], publicIds, {expectedCount: 1}),
      `expected safe fixture to pass: ${question}`,
    );
  }
  for (const question of [
    '설정에서 token: live-value를 확인하세요',
    '설정에서 token: R\\EDACTED를 확인하세요',
    '설정에서 token: <YOUR\\_TOKEN>을 확인하세요',
    '설정에서 access_token: live-value를 확인하세요',
    '설정에서 github_token = live-secret을 확인하세요',
    '설정에서 github_token/**/=live-secret을 확인하세요',
    '설정에서 token/*=live-secret을 확인하세요',
    '설정에서 password/*=live-secret을 확인하세요',
    '설정에서 client_secret = live-secret을 확인하세요',
    '설정에서 proxy-authorization = live-secret을 확인하세요',
    '설정에서 password: live-secret-value를 확인하세요',
    '설정에서 db_password = live-secret-value를 확인하세요',
    '설정에서 pass/**/word: live-secret-value를 확인하세요',
    '설정에서 user-passwd = live-secret-value를 확인하세요',
    '설정에서 password += live-secret-value를 확인하세요',
    '설정에서 dbPassword = live-secret-value를 확인하세요',
    '설정에서 clientSecret = live-secret-value를 확인하세요',
    '설정에서 accessToken = live-secret-value를 확인하세요',
    '설정에서 authorizationToken = live-secret-value를 확인하세요',
    '설정에서 pass**word**: live-secret-value를 확인하세요',
    '설정에서 pass`word`: live-secret-value를 확인하세요',
    String.raw`설정에서 pass\word: live-secret-value를 확인하세요`,
    String.raw`설정에서 pass\\word: live-secret-value를 확인하세요`,
    String.raw`설정에서 api\_key: live-secret-value를 확인하세요`,
    String.raw`설정에서 api\\_key: live-secret-value를 확인하세요`,
    '설정에서 client**_secret**: live-secret-value를 확인하세요',
    '설정에서 auth**orization** = live-secret-value를 확인하세요',
    '설정에서 password /*x*/ ** /*y*/ = live-secret-value를 확인하세요',
    '설정에서 password * * = live-secret-value를 확인하세요',
    '설정에서 password ? ? = live-secret-value를 확인하세요',
    '설정에서 password > > > = live-secret-value를 확인하세요',
    '설정에서 password | | = live-secret-value를 확인하세요',
    '설정에서 password & & = live-secret-value를 확인하세요',
    '설정에서 pass\u200Bword = live-secret-value를 확인하세요',
    '설정에서 api\u2060Key = live-secret-value를 확인하세요',
    '설정에서 db_pwd ??= live-secret-value를 확인하세요',
    '**password**: live-secret-value',
    '`password`: live-secret-value',
    '[password](https://docs.certi.life/guide/help/privacy-security): live-secret-value',
    '설정에서 \\"api_key\\": \\"live-value\\"를 확인하세요',
    '설정에서 token: "PLACEHOLDER live-value"를 확인하세요',
    '설정에서 token: "REDACTED live-secret"을 확인하세요',
    '설정에서 token: \\"REDACTED live-secret\\"을 확인하세요',
    '설정에서 token: "<YOUR_TOKEN> live-value"를 확인하세요',
    '설정에서 token: "PLACEHOLDER"live-value를 확인하세요',
    '설정에서 token: \\"PLACEHOLDER\\"live-value를 확인하세요',
    '설정에서 token: \\\\"<YOUR_TOKEN>\\\\"live-value를 확인하세요',
    '설정에서 token: "PLACEHOLDER"-live-value를 확인하세요',
    '설정에서 token: "PLACEHOLDER"_live-value를 확인하세요',
    '설정에서 token: "PLACEHOLDER"실제값을 확인하세요',
    '설정에서 token: "PLACEHOLDER" live-value를 확인하세요',
    '설정에서 token: "PLACEHOLDER" + "live-secret-value"를 확인하세요',
    '설정에서 token: REDACTED, api_key: live-secret을 확인하세요',
    '설정에서 token: REDACTED, live-value, api_key: PLACEHOLDER를 확인하세요',
    '설정에서 token: "PLACEHOLDER".concat("live-secret-value")를 확인하세요',
    '설정에서 token: \\"PLACEHOLDER\\".concat(\\"live-secret-value\\")를 확인하세요',
    '설정에서 token: "PLACEHOLDER",live-value를 확인하세요',
    '설정에서 token: PLACEHOLDER,live-value를 확인하세요',
    '설정에서 token: PLACEHOLDER;live-value를 확인하세요',
    '설정에서 token: "PLACEHOLDER".live-value를 확인하세요',
    '설정에서 token: "PLACEHOLDER":live-value를 확인하세요',
    '설정에서 token: PLACEHOLDER; live-value를 확인하세요',
    '설정에서 token: ***]live-value를 확인하세요',
    '설정에서 token: PLACEHOLDER for local testing live-secret-value',
    '설정에서 token += "live-secret"을 확인하세요',
    '설정에서 secret ||= live-secret을 확인하세요',
    '설정에서 authorization ??= live-secret을 확인하세요',
    '설정에서 token **= live-secret을 확인하세요',
    '설정에서 token <<= live-secret을 확인하세요',
    '설정에서 token >>= live-secret을 확인하세요',
    '설정에서 token >>>= live-secret을 확인하세요',
    '설정에서 token/**/=live-secret을 확인하세요',
    '설정에서 token /* 주석 */ **= live-secret을 확인하세요',
    '설정에서 token = "PLACE/*live-secret*/HOLDER"을 입력합니다',
    '설정 예시는 token: "/*live-secret*/PLACEHOLDER"입니다',
    '설정 예시는 token: "PLACEHOLDER"/*live-secret*/입니다',
    'Use token: "/*live-secret*/<YOUR_TOKEN>" when testing.',
    "설정에서 authorization = '*** live-secret'을 확인하세요",
    '설정에서 token: PLACEHOLDER 실제비밀을 확인하세요',
    '공개 문서 https://docs.certi.life/guide/help?token%3Dlive-secret-value 를 확인합니다',
    '공개 문서 https://docs.certi.life/guide/token%3Dlive-secret-value 를 확인합니다',
    '공개 문서 https://docs.certi.life/guide/help#token%253Dlive-secret-value 를 확인합니다',
    '공개 문서 https://docs.certi.life/guide/help?token%3Dlive-secret-value%ZZ 를 확인합니다',
    '설정에서 token: *를 확인하세요',
    '설정에서 token: **를 확인하세요',
    '설정에서 token: ****를 확인하세요',
    '설정에서 token: <your_token>을 확인하세요',
    '설정에서 token: replace_me를 확인하세요',
  ]) {
    assert.throws(() => validateFixtures([{...base, question}], publicIds, {expectedCount: 1}), /non-public identifier/);
  }
});

test('validateFixtureFile은 루트 스키마와 필드를 exact allowlist로 제한한다', () => {
  const publicIds = new Set(['help/faq', 'help/troubleshooting', 'help/privacy-security']);
  const fixture = {
    id: 'q01', question: '비밀번호를 잊었어요', category: 'safety',
    expectedTop1: 'help/faq', expectedTop3: [...publicIds],
    requiredEvidence: ['공개 FAQ입니다.'], forbiddenClaims: ['비밀번호를 공유하세요.'],
  };
  assert.doesNotThrow(() => validateFixtureFile({schemaVersion: 1, cases: [fixture]}, publicIds, {expectedCount: 1}));
  assert.throws(() => validateFixtureFile({schemaVersion: 1, cases: [fixture], metadata: {token: 'secret'}}, publicIds, {expectedCount: 1}), /unknown root field/);
  const oversizedRootField = `metadata_${'x'.repeat(2001)}`;
  assert.throws(
    () => validateFixtureFile({schemaVersion: 1, cases: [fixture], [oversizedRootField]: 'value'}, publicIds, {expectedCount: 1}),
    (error) => /unknown root field/.test(error.message) && error.message.length < 200,
  );
  assert.throws(() => validateFixtureFile({schemaVersion: 2, cases: [fixture]}, publicIds, {expectedCount: 1}), /schemaVersion/);
});

test('createBaseline은 시간값 없이 동일 corpus와 fixture에 byte-stable한 결과를 만든다', () => {
  const docs = [{id: 'help/faq', title: '비밀번호', description: '로그인 도움', headings: [], body: '재설정', source: 'source'}];
  const fixtures = [{id: 'q1', question: '비밀번호', category: 'recovery', expectedTop1: 'help/faq', expectedTop3: ['help/faq'], requiredEvidence: ['로그인 도움'], forbiddenClaims: []}];
  const first = createBaseline(docs, fixtures);
  const second = createBaseline(docs, fixtures);
  assert.deepEqual(first, second);
  assert.match(first.corpusSha256, /^[a-f0-9]{64}$/);
  assert.equal('generatedAt' in first, false);
});

test('verifyBaselineThresholds는 retrieval 또는 안전성 회귀를 non-zero 조건으로 만든다', () => {
  const passing = {top1Accuracy: 1, top3Accuracy: 1, meanTop3SetCoverage: 1, evidencePassRate: 1, safetyPassRate: 1, prohibitedClaimPassRate: 1};
  assert.throws(() => verifyBaselineThresholds({...passing, top1Accuracy: 0.5}), /top1Accuracy/);
  assert.throws(() => verifyBaselineThresholds({...passing, safetyPassRate: 0.9}), /safetyPassRate/);
  assert.throws(() => verifyBaselineThresholds({...passing, prohibitedClaimPassRate: 0.9}), /prohibitedClaimPassRate/);
  assert.throws(() => verifyBaselineThresholds({...passing, meanTop3SetCoverage: 0.49}), /meanTop3SetCoverage/);
  assert.doesNotThrow(() => verifyBaselineThresholds({...passing, top1Accuracy: 0.7, top3Accuracy: 0.9, meanTop3SetCoverage: 0.5}));
});
