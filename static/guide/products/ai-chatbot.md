# AI 상담

> 등록 자료 기반 답변, 다국어 상담 번역과 상담원 연결까지 이어지는 AI 상담 운영 방법을 소개합니다.

[사람이 읽는 원문](https://docs.certi.life/guide/products/ai-chatbot)

CertiLife AI 상담은 조직이 등록한 자료를 바탕으로 반복 문의에 답하고, 서로 다른 언어의 메시지를 번역하며, 필요한 상담을 상담원에게 이어주는 고객 응대 서비스입니다. 여러 상담 채널에서 같은 번역 흐름을 사용할 수 있으며 조직의 상담 목적에 맞춰 시나리오를 구성할 수 있습니다. 답변 품질은 등록 자료와 운영 정책에 크게 좌우되므로 시작 전 지식 정리와 연결 기준을 함께 준비하고, 번역 메시지는 발송 전에 고객 언어와 고유명사 표현을 확인해야 합니다.

자료 등록, 답변 범위, 채널 연결은 모두 Studio에서 합니다. 화면별 조작은 [챗봇 메뉴 시작하기](https://docs.certi.life/guide/studio/screens/chatbot/overview)에서 따라갈 수 있습니다. 이 문서에서 말하는 AI 음성봇은 전화를 받는 AI이며, Studio 왼쪽 메뉴에서는 `콜봇`이라는 이름으로 보입니다.

## 목적

- 반복 문의에 일관된 기본 정보를 제공합니다.
- 고객과 상담사가 서로 다른 언어를 사용할 때 수신 메시지를 자동 번역하고 발신 전 번역 여부를 선택할 수 있습니다.
- 고객이 영업시간, 이용 방법, 준비 사항처럼 확인 가능한 정보를 빠르게 찾도록 돕습니다.
- AI 답변 범위를 벗어나거나 담당자 확인이 필요한 문의를 정해진 기준에 따라 전달합니다.
- 채널별 고객 경험을 맞춤 시나리오로 정리합니다.

## 준비할 내용

1. **사용 채널:** 웹챗(홈페이지 채팅), 카카오톡, Instagram, LINE, WhatsApp 중 운영할 접점을 정합니다. 이 목록은 Studio 챗봇 목록의 카드에 표시되는 채널 기준입니다. 네이버 톡톡은 [채널 연동](https://docs.certi.life/guide/studio/screens/org-settings/channels)과 챗봇의 [채널 설정](https://docs.certi.life/guide/studio/screens/chatbot/settings/channel-settings) 화면에 항목이 있지만, 점검한 챗봇 카드에는 표시되지 않았습니다. 위챗은 `준비중`이라 아직 상담 채널로 쓸 수 없습니다.
2. **등록 자료:** 공개 가능하고 최신 상태인 안내문, FAQ, 운영시간, 서비스 설명을 모읍니다.
3. **번역 점검:** 기본 상담 언어와 병원명·브랜드명·시술명 같은 고유명사가 의도대로 번역되는지 확인합니다.
4. **답변 범위:** AI가 안내할 항목과 담당자 확인이 필요한 항목을 구분합니다.
5. **업무시간 정책:** 업무시간에는 상담원 연결을 어떻게 할지, 업무 외 시간에는 무엇을 안내할지 원칙을 정합니다. 채팅은 챗봇의 [작동시간](https://docs.certi.life/guide/studio/screens/chatbot/settings/operating-hours)에서 정한 시간에 `미작동 시나리오` 안내가 나가고, 들어온 문의는 담당자가 다음 업무시간에 확인합니다. 전화는 AI 음성봇(Studio 메뉴 `콜봇`)을 함께 쓰는 조직에서만 콜봇이 받습니다.
6. **책임자:** 자료 갱신, 답변·번역 점검, 전달된 문의 확인을 맡을 담당자를 지정합니다.

## 운영 절차

1. 실제 문의를 주제별로 모으되 개인정보는 제거합니다.
2. 승인된 자료를 질문과 답변 단위로 정리하고 중복·모순을 점검합니다.
3. 채널과 문의 유형에 맞는 시나리오를 설계합니다.
4. 상담원 연결 조건과 업무 외 시간의 안내를 문장으로 명확히 적습니다.
5. 가상 질문으로 정상 답변, 답변 불가, 업무시간 내 상담원 연결, 업무 외 안내 상황을 시험합니다.
6. 운영 후 발견한 누락 정보와 오래된 표현을 정기적으로 수정합니다. 챗봇이 답하지 못한 질문은 Studio 챗봇의 [통계 탭](https://docs.certi.life/guide/studio/screens/chatbot/statistics)에서 확인합니다.

### 가상 예시

가상의 고객이 웹챗봇에서 “토요일 운영시간을 알려주세요”라고 묻는다면 등록된 최신 운영시간 자료를 근거로 답할 수 있습니다. “레이저 시술 후 세안은 언제부터 되나요?”처럼 시술 후 관리 문의도 승인된 주의사항 안내문이 등록되어 있으면 그 내용으로 답합니다. 반면 개별 상태에 대한 판단이나 등록 자료로 확인할 수 없는 내용은 임의로 답하지 않고 담당자 확인 대상으로 분류합니다.

> **주의**
>
> AI가 참조할 자료에는 공개 가능한 정보만 포함하세요. 개인별 의학적 판단이 필요한 질문은 자동 답변 대상으로 두지 말고, 병원의 책임 있는 담당자가 확인할 수 있도록 연결 기준을 마련하세요. 실제 등록 화면은 Studio의 [AI 학습자료 설정](https://docs.certi.life/guide/studio/screens/chatbot/settings/training-materials), 답변 범위는 [AI 설정](https://docs.certi.life/guide/studio/screens/chatbot/settings/ai-settings)을 보세요.

## 다음 문서

- [상담 지식 준비하기](https://docs.certi.life/guide/products/ai-chatbot/knowledge-preparation)
- [상담 메시지 번역](https://docs.certi.life/guide/products/ai-chatbot/message-translation)
- [상담원 연결 정책 세우기](https://docs.certi.life/guide/products/ai-chatbot/handoff-policy)
- [챗봇 메뉴 시작하기](https://docs.certi.life/guide/studio/screens/chatbot/overview)
- [AI 학습자료 설정](https://docs.certi.life/guide/studio/screens/chatbot/settings/training-materials)
- [AI 설정](https://docs.certi.life/guide/studio/screens/chatbot/settings/ai-settings)
- [작동시간](https://docs.certi.life/guide/studio/screens/chatbot/settings/operating-hours)
- [채널 설정](https://docs.certi.life/guide/studio/screens/chatbot/settings/channel-settings)
- [개인정보 및 보안](https://docs.certi.life/guide/help/privacy-security)
- [도입 문의](https://certi.life/contact)
