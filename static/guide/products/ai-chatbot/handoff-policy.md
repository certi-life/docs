# 상담원 연결 정책

> 업무시간과 문의 유형에 따라 AI 상담을 상담원 또는 담당자에게 전달하는 기준을 세웁니다.

[사람이 읽는 원문](https://docs.certi.life/guide/products/ai-chatbot/handoff-policy)

상담원 연결 정책은 AI가 계속 안내할 상황과 사람이 확인할 상황을 미리 구분하는 운영 기준입니다. 이 문서는 채팅 채널의 정책입니다. 이 문서에서 **상담원**은 업무시간에 채팅을 이어받아 답하는 사람이고, **담당자**는 업무 외 시간에 들어온 문의를 다음 업무시간에 확인하는 사람입니다. 두 역할을 같은 사람이 맡아도 됩니다. 어떤 채널을 쓰더라도 고객이 현재 상태와 다음 응답 시점을 이해할 수 있어야 합니다.

정책을 정한 뒤 실제로 입력하는 Studio 화면은 세 곳입니다. 챗봇이 쉬는 시간과 그때 나가는 `미작동 시나리오`는 [작동시간](https://docs.certi.life/guide/studio/screens/chatbot/settings/operating-hours), 고객이 누르는 `상담사 연결` 버튼은 [블럭과 버튼](https://docs.certi.life/guide/studio/screens/chatbot/blocks#버튼-동작-정하기), 특정 채널을 챗봇 없이 처음부터 사람이 받게 하는 `상담원 바로 연결`은 [채널 설정](https://docs.certi.life/guide/studio/screens/chatbot/settings/channel-settings#챗봇-없이-바로-상담원에게-연결하기)입니다. 넘어온 상담을 받는 화면은 [상담](https://docs.certi.life/guide/studio/screens/counsel/overview)입니다. 전화를 콜봇에서 상담사에게 넘기는 조작(`상담사 전환`)은 이 문서가 아니라 [전화상담](https://docs.certi.life/guide/studio/screens/phone-counsel)과 [콜봇 도구](https://docs.certi.life/guide/studio/screens/callbot/tools)를 보세요.

## 목적

- 등록 자료로 답할 수 없는 문의가 방치되지 않도록 합니다.
- 업무시간 내 상담원 연결과 업무 외 시간 안내의 기준을 일관되게 적용합니다.
- 웹챗·카카오톡 등 운영하는 모든 채팅 채널에서 고객에게 같은 기대 수준을 안내합니다.
- 긴급성이나 개별 확인이 필요한 문의를 담당자가 검토하도록 분류합니다.

## 준비할 내용

- 업무시간, 휴무일, 연결 가능한 상담 인력
- AI가 답할 수 있는 주제와 담당자 확인이 필요한 주제
- 업무 외 시간에 나갈 `미작동 시나리오` 안내 문구와 담당자가 확인할 항목
- 전달 시 필요한 최소 정보와 보관 기준
- 담당자가 문의를 확인할 목표 시간과 누락 점검 방법

## 정책 수립 절차

1. **문의 유형을 나눕니다.** 세 가지로 구분합니다.

   | 유형                | 예시                                                    | 처리                           |
   | ----------------- | ----------------------------------------------------- | ---------------------------- |
   | 등록 자료로 답할 수 있는 문의 | 운영시간, 위치, 주차, 예약 방법                                   | AI가 답합니다                     |
   | 추가 확인이 필요한 문의     | 특정 날짜의 예약 가능 여부, 공개되지 않은 비용                           | 상담원 연결 또는 담당자 확인             |
   | 개별 판단이 필요한 문의     | 시술 후 통증·붓기·부작용, 시술 적합성("저 코 수술 되나요"), 비용 확정, 치료 결과 해석 | AI가 단정하지 않고 담당자 확인 대상으로 넘깁니다 |

2. **업무시간 규칙을 정합니다.** 상담원이 가능한 시간과 연결 대상, 연결이 지연될 때 보여줄 안내를 적습니다. 고객이 상담원 연결을 요청하거나 상담원이 대화에 개입하면 AI 응대를 멈추고 사람이 이어받도록 정합니다.

3. **업무 외 규칙을 정합니다.** 채팅 채널에서는 챗봇의 `미작동 시나리오`로 운영시간과 다음 응답 가능 시점을 안내하고, 들어온 문의는 담당자가 다음 업무시간에 확인합니다. 챗봇만 운영하는 병원은 여기까지가 업무 외 처리의 전부입니다. AI 음성봇(콜봇)을 함께 쓰는 병원은 전화의 업무 외 안내를 콜봇에서 따로 정합니다.

4. **최소 정보만 받습니다.** 담당자가 후속 확인에 꼭 필요한 정보만 요청하고 민감한 내용을 채팅에 과도하게 남기지 않도록 합니다.

5. **채널별 문구를 맞춥니다.** 표현 길이는 달라도 연결 여부, 응답 주체, 예상 시점은 일관되게 안내합니다.

6. **가상 상황으로 검증합니다.** 업무시간 내 즉시 연결, 연결 지연, 업무 외 문의, 자료에 없는 질문을 시험합니다.

7. **누락을 검토합니다.** 전달된 문의가 담당자에게 도착하고 처리 상태를 확인할 수 있는 내부 책임을 정합니다.

## 연결 체크리스트

- [ ] 고객이 상담원 또는 담당자에게 전달된 사실을 알 수 있습니다.
- [ ] 고객이 상담원 연결을 요청하거나 상담원이 개입하면 AI 응대가 멈춥니다.
- [ ] 업무시간과 예상 확인 시점이 최신 정보입니다.
- [ ] AI가 불확실한 내용을 단정하지 않습니다.
- [ ] 전달 정보에 불필요한 개인정보가 포함되지 않습니다.
- [ ] 담당자 부재 또는 지연 시 사용할 안내가 준비되어 있습니다.

> **주의**
>
> 개별 의학적 판단이 필요한 내용은 자동 답변으로 확정하지 말고 병원의 책임 있는 담당자가 확인하도록 하세요. “곧 답변”처럼 기준 없는 약속보다 실제 운영 가능한 확인 시간을 안내해야 합니다. 정한 정책을 입력하는 화면은 [작동시간](https://docs.certi.life/guide/studio/screens/chatbot/settings/operating-hours), [블럭과 버튼](https://docs.certi.life/guide/studio/screens/chatbot/blocks), [채널 설정](https://docs.certi.life/guide/studio/screens/chatbot/settings/channel-settings)입니다.

## 다음 문서

- [AI 상담 지식 준비](https://docs.certi.life/guide/products/ai-chatbot/knowledge-preparation)
- [AI 상담 개요](https://docs.certi.life/guide/products/ai-chatbot)
- [상담 시나리오와 사람 연결](https://docs.certi.life/guide/studio/scenario-and-handoff)
- [작동시간](https://docs.certi.life/guide/studio/screens/chatbot/settings/operating-hours)
- [블럭과 버튼](https://docs.certi.life/guide/studio/screens/chatbot/blocks)
- [채널 설정](https://docs.certi.life/guide/studio/screens/chatbot/settings/channel-settings)
- [상담 - 채팅 상담 화면 한눈에 보기](https://docs.certi.life/guide/studio/screens/counsel/overview)
- [개인정보 및 보안](https://docs.certi.life/guide/help/privacy-security)
