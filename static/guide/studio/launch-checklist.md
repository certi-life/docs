# Studio 출시 체크리스트

> AI 챗봇·상담원 연결·AI 음성봇을 고객에게 공개하기 전과 공개 직후 확인할 운영 체크리스트입니다.

[사람이 읽는 원문](https://certi.life/docs/guide/studio/launch-checklist)

Studio에서 준비한 AI 상담은 아래 항목을 모두 확인한 뒤 공개를 승인하세요. 카카오톡, 네이버톡톡, 웹챗봇 또는 AI 음성봇 공개 전 공통으로 사용하는 체크리스트입니다. 항목을 설정하는 화면은 각 단계 끝의 "화면:" 줄에 있습니다.

## 1. 책임과 범위

- [ ] 출시 승인자, 지식 책임자, 상담 운영 담당자, 사고 대응 연락 담당자를 정했습니다.
- [ ] AI가 답할 질문과 답하지 않을 질문을 문서로 합의했습니다.
- [ ] 의료진 판단이 필요한 문의와 긴급 문의의 연결 기준을 확인했습니다.
- [ ] 적용할 채널과 대상 고객을 명확히 정했습니다.
- [ ] 업무시간, 휴일, 임시 운영 변경의 관리 책임자를 정했습니다.

한 사람이 자료 준비부터 승인까지 모두 맡기보다 내용 책임자와 최종 승인자가 서로 검토하는 방식을 권장합니다. 문제가 발생했을 때 누가 상담 범위를 줄이거나 운영을 중단할지 미리 결정하세요. 조직 설정은 조직의 모든 상담원 화면에 적용되므로, 조직 설정을 바꿀 사람도 이때 정합니다. 자세한 내용은 [누가 무엇을 바꿀 수 있나요](https://certi.life/docs/guide/studio/screens/overview#누가-무엇을-바꿀-수-있나요)를 보세요.

화면: [누가 무엇을 바꿀 수 있나요](https://certi.life/docs/guide/studio/screens/overview#누가-무엇을-바꿀-수-있나요)

## 2. 채널 연동과 수신 시험

- [ ] 공개할 채널의 계정을 `채널 설정`에서 조직에 연동했습니다.
- [ ] 네이버 톡톡과 LINE은 화면에 표시된 웹훅 URL을 상대 서비스에 등록했습니다. 등록하지 않으면 연동된 것처럼 보여도 메시지가 들어오지 않습니다.
- [ ] 챗봇의 `채널 설정`에서 채널마다 응답할 챗봇을 지정했습니다.
- [ ] 채널마다 고객 쪽에서 직접 메시지를 보내, 상담 화면에 도착하는지와 답이 나가는지 확인했습니다. Studio에는 연결을 시험하는 버튼이 없습니다.

화면: [채널 연동](https://certi.life/docs/guide/studio/screens/org-settings/channels), [챗봇의 채널 설정](https://certi.life/docs/guide/studio/screens/chatbot/settings/channel-settings)

## 3. 상담 시간, 알림, 시간 외 안내

- [ ] `상담 시간`의 `채팅 상담` 가능 시간과 특수일을 실제 근무에 맞췄습니다.
- [ ] 상담이 들어오면 알림톡을 받을 관리자를 `관리자 알림`의 `관리자 목록`에 등록하고, 받을 채널을 골랐습니다.
- [ ] `상담사 알림`의 알림 대상을 정하고, 시험 상담으로 알림이 실제로 오는지 확인했습니다.
- [ ] `자동메시지`의 `운영 시간 외 메시지`에 상담 가능 시간과 답변을 받을 시점을 적었습니다.

화면: [상담 시간](https://certi.life/docs/guide/studio/screens/org-settings/hours), [알림](https://certi.life/docs/guide/studio/screens/org-settings/alerts), [자동메시지](https://certi.life/docs/guide/studio/screens/org-settings/auto-messages)

## 4. 지식 자료

- [ ] 등록 자료가 고객 공개 승인을 받은 최신 자료입니다.
- [ ] 고객·환자 정보, 내부 메모, 직원 개인정보가 포함되지 않았습니다.
- [ ] 운영시간, 위치, 예약 방법, 서비스 설명의 중복과 충돌을 정리했습니다.
- [ ] 숫자, 날짜, 연락처, 지점명을 원본과 대조했습니다.
- [ ] 자료별 책임자와 다음 검토일을 기록했습니다.
- [ ] 의료적 판단을 유도하는 표현을 제거하고 사람 연결 기준을 연결했습니다.

자세한 기준은 [상담 지식 관리](https://certi.life/docs/guide/studio/knowledge-management)를 참고하세요.

화면: [백과사전](https://certi.life/docs/guide/studio/screens/encyclopedia), [AI 학습자료 설정](https://certi.life/docs/guide/studio/screens/chatbot/settings/training-materials)

## 5. 시나리오와 상담원 연결

- [ ] 정상 질문이 승인된 근거로 답변됩니다.
- [ ] 모르는 질문에 내용을 꾸며내지 않고 한계를 안내합니다.
- [ ] 고객이 상담원을 요청할 때 정해진 흐름으로 연결됩니다.
- [ ] 업무시간 안과 밖의 안내가 서로 다르고 정확합니다.
- [ ] 연결할 수 없을 때 고객이 다음 행동과 예상 시점을 알 수 있습니다.
- [ ] 의료 판단, 불만, 개인정보, 긴급 표현을 가상 질문으로 시험했습니다.

연결 정책을 정할 때는 [상담 시나리오와 사람 연결](https://certi.life/docs/guide/studio/scenario-and-handoff)을 사용하세요.

화면: [블럭과 버튼](https://certi.life/docs/guide/studio/screens/chatbot/blocks#버튼-동작-정하기), [작동시간](https://certi.life/docs/guide/studio/screens/chatbot/settings/operating-hours)

## 6. 채널별 시험

카카오톡, 네이버톡톡, 웹챗봇은 각각 실제 고객이 보는 환경에서 문장 줄바꿈, 링크 목적, 응답 길이, 사람 연결 안내를 확인합니다. 여러 채널을 동시에 운영한다면 같은 질문이 의미상 같은 답을 받는지 비교하세요. 모바일 화면에서 텍스트와 링크를 읽고 선택할 수 있는지도 확인합니다.

상담 번역을 사용한다면 고객 언어 자동 감지, 상담원의 언어 변경, 수신 자동 번역, 발신 전 번역과 번역 생략 발송을 모두 시험합니다. 병원명·브랜드명·시술명 같은 고유명사가 의도대로 번역되는지는 시험 메시지의 `실제 발송` 문구로 확인하세요. Studio에는 번역 용어집을 보거나 고치는 화면이 없으므로, 계속 틀리게 번역되는 고유명사는 CertiLife 고객센터(1800-8984)에 알립니다.

AI 음성봇은 조용한 환경뿐 아니라 일반적인 주변 소음에서도 시험합니다. 숫자, 날짜, 운영시간이 정확히 들리는지, 잘못 인식했을 때 다시 질문하는지, 고객이 사람 연결을 요청할 수 있는지 확인합니다. 테스트에는 실제 전화번호나 진료 내용을 사용하지 말고 승인된 가상 자료를 사용하세요.

화면: [외국어 고객과 대화하기](https://certi.life/docs/guide/studio/screens/counsel/translation), [번역 설정](https://certi.life/docs/guide/studio/screens/org-settings/translation), [콜봇](https://certi.life/docs/guide/studio/screens/callbot/overview)

## 7. 공개 직전 승인

- [ ] 개인정보 없는 테스트 결과와 남은 예외를 승인자가 검토했습니다.
- [ ] 고객에게 AI 상담임을 혼동 없이 알릴 표현을 확인했습니다.
- [ ] 운영 중 잘못된 답변을 발견했을 때 보고할 경로가 준비되었습니다.
- [ ] 상담원과 운영 담당자가 연결 정책과 인계 내용을 이해했습니다.
- [ ] 계정 비밀번호와 내부 자료가 테스트 캡처에 포함되지 않았습니다.

## 8. 공개 후 점검

공개 직후에는 대표 질문, 사람 연결, 업무시간 외 안내가 계속 정상인지 확인합니다. 잘못된 답변을 발견하면 고객 개인정보를 복사해 공유하지 말고 질문 유형, 기대 답변, 사용한 근거 자료를 중심으로 기록합니다. 개인정보 노출, 의료적 오안내, 반복적인 연결 실패처럼 위험이 큰 문제가 있으면 범위를 즉시 줄이거나 조직이 정한 방식으로 운영을 중단하고 책임자에게 보고하세요. 수정 후에는 관련 시나리오뿐 아니라 유사 질문도 다시 시험합니다.

화면: 챗봇이 답하지 못한 질문은 [챗봇 통계 탭](https://certi.life/docs/guide/studio/screens/chatbot/statistics), 지난 상담은 [상담 내역](https://certi.life/docs/guide/studio/screens/conversation-history)에서 봅니다.

> **출시는 끝이 아니라 운영 시작입니다**
>
> 정기 검토일을 정하고 자료 변경, 운영시간 변경, 반복 실패를 반영하세요. 담당자가 바뀌면 계정을 공유하지 말고 책임과 접근을 새로 정리합니다.

## 함께 보기

- [Studio 운영 가이드](https://certi.life/docs/guide/studio/overview)
- [Studio 계정 접속](https://certi.life/docs/guide/studio/account-access)
- [상담 지식 관리](https://certi.life/docs/guide/studio/knowledge-management)
- [상담 메시지 번역](https://certi.life/docs/guide/products/ai-chatbot/message-translation)
- [상담 내역 조회와 화면 설정](https://certi.life/docs/guide/studio/conversation-history)
- [상담 기록 필드 설정](https://certi.life/docs/guide/studio/consultation-records)
- [개인정보 및 보안](https://certi.life/docs/guide/help/privacy-security)
