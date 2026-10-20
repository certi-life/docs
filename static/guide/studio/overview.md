# Studio 운영 가이드

> AI 상담 지식, 시나리오, 상담원 연결과 출시 점검을 준비하는 Studio 공개 운영 가이드입니다.

[사람이 읽는 원문](https://certi.life/docs/guide/studio/overview)

Studio는 등록한 자료를 기반으로 AI 챗봇 상담을 준비하고 운영하는 서비스입니다. 여러 상담 채널의 메시지를 한곳에서 확인하고, 서로 다른 언어의 상담을 번역하며, 상담 내역의 요약·분류와 전화상담 기록을 관리할 수 있습니다. 운영자는 지식 자료와 답변 경계, 상담원 연결 기준, 상담 기록 구조를 함께 준비해야 합니다. 제품 소개에서 AI 음성봇이라고 부르는 전화 응대 AI는 Studio 왼쪽 메뉴에서 `콜봇`이라는 이름으로 보입니다.

개인정보와 의료적 판단이 포함된 상담에는 조직의 운영·보안 기준을 함께 적용하세요.

## 권장 시작 순서

처음 도입할 때는 아래 순서로 준비합니다. [설정 한눈에 보기](https://certi.life/docs/guide/studio/screens/org-settings/overview#상담-운영-기준-정하기)에 나오는 `운영 설정`의 순서는 아래 3단계를 자세히 나눈 것입니다.

1. 계정: [Studio 계정 접속](https://certi.life/docs/guide/studio/account-access)에서 내 계정 종류에 맞는 로그인 방법과 안전한 접속 원칙을 확인합니다.
2. 채널 연동: 메신저 계정을 조직에 연동하고, 웹훅 등록이 필요한 채널은 등록까지 마칩니다. 알림톡 채널은 3단계의 `상황별 콜백`보다 먼저 연동해야 합니다. 화면: [채널 연동](https://certi.life/docs/guide/studio/screens/org-settings/channels)
3. 조직 운영 기준: `설정`의 `운영 설정`에서 상담 시간, 알림, 번역, 상황별 콜백, 자주 사용하는 답변을 정하고, `자동메시지`에서 `운영 시간 외` 문구를 정합니다. 화면: [설정 한눈에 보기](https://certi.life/docs/guide/studio/screens/org-settings/overview#상담-운영-기준-정하기), [자동메시지](https://certi.life/docs/guide/studio/screens/org-settings/auto-messages)
4. 지식: [상담 지식 관리](https://certi.life/docs/guide/studio/knowledge-management)의 기준으로 공개 가능한 자료를 골라 백과사전에 등록합니다. 화면: [백과사전](https://certi.life/docs/guide/studio/screens/encyclopedia)
5. 시나리오와 사람 연결: [상담 시나리오와 사람 연결](https://certi.life/docs/guide/studio/scenario-and-handoff)에서 고객 질문 흐름, 업무시간, 상담원 연결 조건을 정한 뒤 챗봇에 입력합니다. 화면: [챗봇 메뉴 시작하기](https://certi.life/docs/guide/studio/screens/chatbot/overview)
6. 상담 기록: 전화상담을 쓴다면 [상담 기록 필드 설정](https://certi.life/docs/guide/studio/consultation-records)에서 후처리 필드와 AI 자동 선택을 준비합니다.
7. 출시 점검: [출시 체크리스트](https://certi.life/docs/guide/studio/launch-checklist)로 채널별 시험과 운영 책임자를 확인한 뒤 고객에게 공개합니다.

운영을 시작한 뒤에는 [상담 내역 조회와 화면 설정](https://certi.life/docs/guide/studio/conversation-history)의 기준으로 지난 상담을 확인합니다. 외국어 상담이 있다면 [상담 메시지 번역](https://certi.life/docs/guide/products/ai-chatbot/message-translation)에서 언어 감지와 고유명사 확인 절차를 미리 읽어 두세요.

지금 보고 있는 화면에서 무엇을 어떻게 하는지 궁금하다면 화면별 안내를 확인하세요. [Studio 메뉴 한눈에 보기](https://certi.life/docs/guide/studio/screens/overview)에서 메뉴별 역할을 확인하고, 챗봇은 [챗봇 메뉴 시작하기](https://certi.life/docs/guide/studio/screens/chatbot/overview)에서 만들기부터 채널 연결까지 목적별로 따라갈 수 있습니다.

## 운영의 핵심 구조

AI 상담 품질은 등록 자료의 최신성과 범위에 좌우됩니다. 홈페이지, 진료·서비스 안내, 운영시간, 위치, 예약 방법처럼 공개가 승인된 정보만 사용하고, 고객 기록이나 내부 메모는 지식 자료에 넣지 않습니다. 같은 질문에 서로 다른 답이 있는 자료는 책임자가 하나의 기준으로 정리하고, 변경일과 검토일을 관리하세요.

상담 시나리오는 모든 질문에 AI가 답하도록 만드는 작업이 아닙니다. 의료진의 판단이 필요한 질문, 개인 상태에 따른 조언, 민감한 개인정보가 포함된 요청, 불만과 긴급 문의는 사람이 확인하도록 경계를 정해야 합니다. 업무시간 안과 밖의 연결 방식도 구분하고, 연결할 수 없는 시간에는 고객이 기대할 수 있는 답변 시점을 명확히 안내합니다.

화면: 지식 문서는 [백과사전](https://certi.life/docs/guide/studio/screens/encyclopedia), 상담 시간은 [상담 시간](https://certi.life/docs/guide/studio/screens/org-settings/hours), 시간 외 안내 문구는 [자동메시지](https://certi.life/docs/guide/studio/screens/org-settings/auto-messages)에서 정합니다.

## 채널을 준비할 때

카카오톡, 네이버 톡톡, 웹챗처럼 여러 채널을 운영한다면 같은 정책과 최신 정보를 사용하되 채널별 길이와 표현을 점검합니다. AI 음성봇(`콜봇`)은 듣기 쉬운 문장, 숫자·시간의 정확한 발음, 다시 듣기 또는 상담원 연결 방법을 별도로 시험하세요. 실제 고객에게 공개하기 전에는 개인정보가 없는 가상 질문으로 정상 답변, 답변 거절, 상담원 연결, 업무시간 외 안내를 모두 확인합니다.

화면: 메신저 계정은 [채널 연동](https://certi.life/docs/guide/studio/screens/org-settings/channels), 전화 응대는 [콜봇](https://certi.life/docs/guide/studio/screens/callbot/overview)에서 준비합니다.

> **AI 상담의 역할**
>
> AI 상담은 의료진의 진단, 처방 또는 의학적 판단을 대신하지 않습니다. 고객이 증상이나 치료 결과에 대한 판단을 요청하면 병원이 정한 의료진 또는 상담 담당자에게 연결되도록 운영 기준을 마련하세요.

## 함께 보기

- [AI 상담 소개](https://certi.life/docs/guide/products/ai-chatbot)
- [상담 메시지 번역](https://certi.life/docs/guide/products/ai-chatbot/message-translation)
- [상담 내역 조회와 화면 설정](https://certi.life/docs/guide/studio/conversation-history)
- [상담 기록 필드 설정](https://certi.life/docs/guide/studio/consultation-records)
- [개인정보 및 보안](https://certi.life/docs/guide/help/privacy-security)
- [Hospital 운영 가이드](https://certi.life/docs/guide/hospital/overview)
- [도입 문의](https://certi.life/contact)
