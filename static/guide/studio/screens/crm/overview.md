# CRM - 고객 데이터를 모아 메시지 운영하기

> Studio CRM 메뉴의 운영 홈, 캘린더, 고객 목록, 데이터 연동, 메시지 템플릿, 캠페인, 시나리오 자동화, 발송 현황이 각각 무엇을 하는지와 고객을 모아 메시지를 보내기까지의 순서를 목적별로 안내합니다.

[사람이 읽는 원문](https://docs.certi.life/guide/studio/screens/crm/overview)

`CRM`은 "고객을 모으고 → 나누고 → 메시지를 보내는" 일을 하는 곳입니다. 화면의 `CRM 운영 홈`에도 이 흐름이 네 단계로 그려져 있습니다. 데이터 수집, 고객 프로필, 세그먼트(조건으로 나눈 고객 묶음), 메시지 운영입니다. 메시지를 보내는 방법은 두 가지입니다. **한 번 보내는 캠페인**과, **조건이 맞으면 자동으로 나가는 시나리오 자동화**입니다.

화면에는 풀이 없이 나오는 말이 둘 있습니다. 왼쪽 메뉴의 그룹 이름 `CDP`는 고객 데이터 플랫폼(Customer Data Platform)의 약자로, 운영 홈이 속한 그룹입니다. `NFT 인증서`는 CertiLife 인증서 데이터를 뜻하며, [데이터 연동](https://docs.certi.life/guide/studio/screens/crm/connectors)으로 CRM에 들어옵니다.

**위치:** CRM

> **조직의 이용 범위에 따라 보입니다**
>
> `CRM` 메뉴는 조직의 이용 범위에 따라 보이지 않을 수 있습니다. 필요하다면 조직의 CertiLife 담당자에게 문의하세요.

## 메뉴 구성

| 그룹       | 메뉴         | 하는 일                                    | 화면 안내                                                                    |
| -------- | ---------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `CDP`    | `운영 홈`     | 발송량, 전환률, 활성 고객, 이탈 위험 등 운영 지표를 한눈에 봅니다 | 이 페이지                                                                    |
| `일정 관리`  | `캘린더`      | 일정과 예약을 등록하고 관리합니다                      | [캘린더](https://docs.certi.life/guide/studio/screens/crm/calendar)         |
| `고객 데이터` | `고객 목록`    | 고객을 등록하고 찾고 세그먼트로 저장합니다                 | [고객 등록과 관리](https://docs.certi.life/guide/studio/screens/crm/customers)  |
|          | `데이터 연동`   | 인증서·EMR 데이터에서 고객을 계속 가져옵니다              | [데이터 연동](https://docs.certi.life/guide/studio/screens/crm/connectors)    |
| `메시지 운영` | `메시지 템플릿`  | `알림톡`, `브랜드 메시지`, `WhatsApp` 템플릿을 만듭니다  | [메시지 템플릿](https://docs.certi.life/guide/studio/screens/crm/templates)    |
|          | `캠페인`      | 대상을 골라 메시지를 한 번 발송하거나 예약합니다             | [캠페인](https://docs.certi.life/guide/studio/screens/crm/campaigns)        |
|          | `시나리오 자동화` | 조건에 맞는 고객에게 자동으로 메시지가 나가는 흐름을 만듭니다      | [시나리오 자동화](https://docs.certi.life/guide/studio/screens/crm/automation)  |
|          | `발송 현황`    | 오늘 발송, 예약 대기, 발송 완료를 확인하고 예약을 취소합니다     | [발송 현황](https://docs.certi.life/guide/studio/screens/crm/message-status) |

## 처음 메시지를 보내기까지

1. **메시지 채널을 연동합니다.** [설정의 채널 연동](https://docs.certi.life/guide/studio/screens/org-settings/channels#카카오-알림톡-채널-연동하기)에서 알림톡 채널을 연결합니다.
2. **고객을 넣습니다.** 직접 등록하거나 CSV로 올리거나 데이터 연동으로 가져옵니다. → [고객 등록과 관리](https://docs.certi.life/guide/studio/screens/crm/customers)
3. **템플릿을 만들어 심사를 받습니다.** 승인된 템플릿만 보낼 수 있고 심사에 시간이 걸리므로 미리 준비합니다. → [메시지 템플릿](https://docs.certi.life/guide/studio/screens/crm/templates)
4. **대상을 나눕니다.** 필터 조건을 세그먼트로 저장합니다. → [조건으로 고객 나누기](https://docs.certi.life/guide/studio/screens/crm/customers#조건으로-고객-나누기)
5. **보냅니다.** 한 번이면 [캠페인](https://docs.certi.life/guide/studio/screens/crm/campaigns), 반복되는 안내면 [시나리오 자동화](https://docs.certi.life/guide/studio/screens/crm/automation)를 씁니다.
6. **결과를 봅니다.** `발송 현황`과 `운영 홈`에서 확인합니다.

## 캠페인과 시나리오 자동화, 무엇을 쓸까요?

|            | `캠페인`            | `시나리오 자동화`                           |
| ---------- | ---------------- | ------------------------------------ |
| 보내는 때      | 지금 또는 정한 일시에 한 번 | 조건이 맞는 고객이 생길 때마다 계속                 |
| 예          | 연말 이벤트 안내, 휴진 공지 | 시술 3일 뒤 관리 안내, 6개월 뒤 재방문 안내          |
| 실패 시 대체 발송 | 없음               | 알림톡·브랜드 메시지 실패 시 SMS 대체 발송을 설정할 수 있음 |

## 운영 홈에서 보는 것

**위치:** CRM > 운영 홈

`CRM 운영 홈`에서는 기간(`오늘`, `이번 주`, `이번 달`, `3개월`)을 골라 지표를 봅니다. `성과 · 고객`에는 `발송량`, `전환률`, `활성 고객`, `이탈 위험`이, `운영 모니터링`에는 `성공률`, `실패`, `예약`, `도달률`이 표시됩니다. 원장 보고에 넣을 지표 이름은 이 카드 이름을 그대로 쓰세요. 각 카드의 분모와 판정 기준은 화면에 표시되지 않아 이 문서에서 확인하지 못했으므로, 화면의 설명을 따르세요. 캠페인 단위의 지표는 [캠페인 성과](https://docs.certi.life/guide/studio/screens/crm/campaigns#발송-결과-확인하기)에서 봅니다.

아래에는 `발송 추이`, `성과 상위 시나리오`, `이탈 위험 고객`, `세그먼트 분포`가 있습니다. `세그먼트 분포`는 고객을 `신규`, `재활동`, `정기`, `단골`, `이탈위험`으로 나누어 보여 주며, 각 단계의 기준은 화면에 표시되지 않습니다. `실패`가 늘었다면 `발송 현황`에서 원인을 확인하고, 여러 건을 다시 보내려면 [캠페인의 `실패 재처리`](https://docs.certi.life/guide/studio/screens/crm/campaigns#발송-결과-확인하기)를 씁니다. `이탈 위험 고객`은 재방문 안내 대상으로 활용합니다.

화면 라벨은 `전환률`입니다. 표준 표기는 "전환율"이지만, 이 문서는 화면과 같은 이름으로 찾을 수 있도록 화면 라벨을 따릅니다.

## 알아 둘 점

- 광고성 메시지는 마케팅 수신에 동의한 고객에게만, 정해진 시간대에만 보낼 수 있습니다. 화면의 안전 검증이 막아 주지만 기준은 [CRM 메시지 발송 전 체크리스트](https://docs.certi.life/guide/products/crm-messaging/message-checklist)에서 미리 확인하세요.
- CRM의 "시나리오"는 챗봇의 [`시나리오` 탭](https://docs.certi.life/guide/studio/screens/chatbot/scenarios)과 이름만 같고 다른 기능입니다. CRM의 `캠페인`도 [콜봇의 `캠페인`](https://docs.certi.life/guide/studio/screens/callbot/campaign)과 이름만 같습니다. CRM 캠페인은 메시지 발송이고, 콜봇 캠페인은 전화 발신입니다.
- 상담 중인 고객에게 바로 보내는 알림톡은 [상담 화면](https://docs.certi.life/guide/studio/screens/counsel/customer#상담-중에-알림톡-보내기)에서 보냅니다.

## 함께 보기

- [CRM 메시징](https://docs.certi.life/guide/products/crm-messaging): 지표 이름과 확인 위치
- [CRM 세그먼트 계획](https://docs.certi.life/guide/products/crm-messaging/segment-planning)
- [CRM 메시지 발송 전 체크리스트](https://docs.certi.life/guide/products/crm-messaging/message-checklist)
