# 콜봇 시작하기 - 전화를 받는 AI 상담원 준비하기

> Studio 콜봇 메뉴에서 에이전트 만들기, 도구와 지식 베이스 연결, 조직 인증, 번호 발급과 연결, 통화 확인까지 콜봇이 실제 전화를 받게 하는 순서와 콜봇 메뉴 구성을 목적별로 안내합니다.

[사람이 읽는 원문](https://docs.certi.life/guide/studio/screens/callbot/overview)

`콜봇`은 전화 문의를 AI 상담원(에이전트)이 받도록 만드는 곳입니다. 채팅의 [챗봇](https://docs.certi.life/guide/studio/screens/chatbot/overview)과 같은 역할을 전화에서 합니다. 콜봇이 실제 전화를 받으려면 **에이전트를 만들고 → 도구와 지식을 넣고 → 조직 인증을 받고 → 번호를 발급해 에이전트에 연결**해야 합니다. 왼쪽의 `시작하기`를 열면 이 순서와 지금까지의 진행 상태를 보여 줍니다.

**위치:** 콜봇 > 시작하기

> **조직의 이용 범위에 따라 보입니다**
>
> `콜봇` 메뉴는 조직의 이용 범위에 따라 보이지 않을 수 있습니다. 또 일부 기능은 화면에 "아직 준비되지 않았습니다"로 표시될 수 있으며, 그 경우 해당 기능은 아직 쓸 수 없습니다. 필요하다면 조직의 CertiLife 담당자 또는 [도입 문의](https://certi.life/contact)로 확인하세요.

## 실제 전화를 받기까지

`콜봇 시작하기` 화면의 단계를 그대로 따라가면 됩니다. 단계마다 자주 막히는 지점을 함께 적었습니다.

| 단계              | 하는 일                                | 자주 막히는 지점                            | 안내                                                                                                |
| --------------- | ----------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 1. 조직 만들기       | 화면 위 배너의 `조직 생성`을 누릅니다. 한 번만 하면 됩니다 | 조직 이름은 등록된 회사명으로 자동 설정됩니다            |                                                                                                   |
| 2. 에이전트 만들기     | 업종과 맡길 일을 고르면 AI가 응대 내용 초안을 씁니다     | AI가 쓴 내용은 초안입니다. 영업시간·가격은 꼭 확인해 고치세요 | [에이전트 만들기](https://docs.certi.life/guide/studio/screens/callbot/agents)                           |
| 3. 도구 넣기        | 통화 종료, 통화 전환 같은 도구를 넣습니다            | 도구가 없으면 모르는 질문에 통화를 그냥 끝냅니다          | [에이전트 설정](https://docs.certi.life/guide/studio/screens/callbot/agent-settings#통화-중에-할-수-있는-일-늘리기) |
| 4. 지식 베이스 넣기    | 백과사전의 문서를 골라 담고 에이전트에 연결합니다         | 담기만 하면 쓰이지 않습니다. 에이전트에 연결해야 합니다      | [지식 베이스](https://docs.certi.life/guide/studio/screens/callbot/knowledge)                          |
| 5. 조직 인증받기      | 사업자 서류를 제출해 인증을 신청합니다               | 승인 전에는 번호 구매가 막혀 있습니다. 미리 신청하세요      | [조직 인증](https://docs.certi.life/guide/studio/screens/callbot/verification)                        |
| 6. 번호 발급하고 연결하기 | 번호를 구매하거나 연동하고 에이전트를 지정합니다          | 번호에 에이전트를 연결하지 않으면 전화가 와도 받지 않습니다    | [번호 관리](https://docs.certi.life/guide/studio/screens/callbot/phone-numbers)                       |
| 7. 전화 걸어 확인하기   | 연결한 번호로 직접 전화해 보고 통화 기록을 확인합니다      | 통화 기록을 보면서 응대 내용을 계속 다듬습니다           | [전화상담](https://docs.certi.life/guide/studio/screens/phone-counsel)                                |

4번 지식 베이스는 건너뛰어도 콜봇은 동작합니다. 다만 넣지 않으면 우리 조직의 정보가 아니라 일반적인 답변만 합니다.

## 메뉴 구성

**위치:** 콜봇

| 그룹           | 메뉴       | 하는 일                      | 화면 안내                                                                                                                                                                                                                               |
| ------------ | -------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `시작`         | `시작하기`   | 단계별 안내와 진행 상태             | 이 페이지                                                                                                                                                                                                                               |
| `AI 상담원 만들기` | `에이전트`   | AI 상담원을 만들고 설정하고 배포합니다    | [에이전트 만들기](https://docs.certi.life/guide/studio/screens/callbot/agents), [에이전트 설정](https://docs.certi.life/guide/studio/screens/callbot/agent-settings), [플로우 편집](https://docs.certi.life/guide/studio/screens/callbot/flow-editor) |
|              | `보이스`    | 쓸 수 있는 목소리를 찾아 미리 듣습니다    | [보이스](https://docs.certi.life/guide/studio/screens/callbot/voices)                                                                                                                                                                  |
|              | `도구`     | 우리 시스템을 호출하는 API 도구를 만듭니다 | [도구](https://docs.certi.life/guide/studio/screens/callbot/tools)                                                                                                                                                                    |
|              | `매뉴얼`    | 상황별 응대 절차를 작성합니다          | [매뉴얼](https://docs.certi.life/guide/studio/screens/callbot/manuals)                                                                                                                                                                 |
|              | `지식 베이스` | 에이전트가 참고할 문서를 담습니다        | [지식 베이스](https://docs.certi.life/guide/studio/screens/callbot/knowledge)                                                                                                                                                            |
| `캠페인`        | `캠페인`    | 목록의 번호로 콜봇이 전화를 겁니다       | [캠페인](https://docs.certi.life/guide/studio/screens/callbot/campaign)                                                                                                                                                                |
| `설정`         | `번호 관리`  | 번호를 구매·연동하고 에이전트에 연결합니다   | [번호 관리](https://docs.certi.life/guide/studio/screens/callbot/phone-numbers)                                                                                                                                                         |
|              | `조직 인증`  | 번호 구매에 필요한 사업자 인증을 신청합니다  | [조직 인증](https://docs.certi.life/guide/studio/screens/callbot/verification)                                                                                                                                                          |

조직의 이용 범위에 따라 `AI 상담원 만들기` 그룹에 [`DTMF 메뉴`](https://docs.certi.life/guide/studio/screens/callbot/dtmf-menus)(전화 키패드로 분기하는 ARS 메뉴 트리)가, `설정` 그룹에 [`사용자 관리`](https://docs.certi.life/guide/studio/screens/callbot/users)(상담사 번호 등록과 그룹 관리)가 함께 보일 수 있습니다.

화면 위에 배너가 보이면 먼저 처리해야 할 일이 있다는 뜻입니다.

| 배너                               | 뜻                                 | 할 일                                                                                          |
| -------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| "콜봇 조직 연결이 필요합니다"                | 이 회사의 콜봇 전용 조직이 아직 없습니다           | `조직 생성`을 누릅니다                                                                                |
| "조직 키 발급 대기 중입니다"                | 조직을 만드는 중입니다. 발급이 끝나면 자동으로 활성화됩니다 | 기다립니다. 그동안 일부 기능이 제한될 수 있습니다                                                                 |
| "조직 인증이 필요합니다", "조직 인증이 반려되었습니다" | 번호 구매 같은 일부 기능은 인증 뒤에 쓸 수 있습니다    | `조직 인증하기`로 [조직 인증](https://docs.certi.life/guide/studio/screens/callbot/verification)을 신청합니다 |

## 하고 싶은 일로 찾기

| 하고 싶은 일                    | 가야 할 화면                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 전화를 받는 AI 상담원을 새로 만들고 싶어요  | [에이전트 만들기](https://docs.certi.life/guide/studio/screens/callbot/agents)                                                                        |
| 목소리, 인사말, 응대 내용을 바꾸고 싶어요   | [에이전트 설정](https://docs.certi.life/guide/studio/screens/callbot/agent-settings)                                                                 |
| 모르는 질문은 상담사에게 넘기게 하고 싶어요   | [에이전트 설정의 도구](https://docs.certi.life/guide/studio/screens/callbot/agent-settings#통화-중에-할-수-있는-일-늘리기)                                          |
| 우리 회사 자료로 답하게 하고 싶어요       | [지식 베이스](https://docs.certi.life/guide/studio/screens/callbot/knowledge)                                                                       |
| 고친 내용이 실제 통화에 반영되지 않아요     | [에이전트 설정의 배포](https://docs.certi.life/guide/studio/screens/callbot/agent-settings#시험하고-배포하기)                                                   |
| 전화번호를 새로 받거나 기존 번호를 쓰고 싶어요 | [번호 관리](https://docs.certi.life/guide/studio/screens/callbot/phone-numbers)                                                                    |
| 번호 구매가 막혀 있어요              | [조직 인증](https://docs.certi.life/guide/studio/screens/callbot/verification)                                                                     |
| 여러 고객에게 안내 전화를 걸고 싶어요      | [캠페인](https://docs.certi.life/guide/studio/screens/callbot/campaign)                                                                           |
| 통화 내용과 녹음을 확인하고 싶어요        | [전화상담](https://docs.certi.life/guide/studio/screens/phone-counsel), [상담 내역](https://docs.certi.life/guide/studio/screens/conversation-history) |

## 공개하기 전에

AI 음성 응대는 글과 달리 고객이 듣고 바로 이해해야 합니다. 공개 전에 직접 전화를 걸어 듣기 쉬운 문장인지, 숫자와 시간을 정확히 말하는지, 다시 듣기와 사람 연결이 되는지 확인하세요. AI 상담원임을 첫 인사에서 밝히는 것도 잊지 마세요. 점검 항목은 [출시 체크리스트](https://docs.certi.life/guide/studio/launch-checklist)에 있습니다.
