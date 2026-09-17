# Hospital 메뉴 한눈에 보기

> Hospital 병원 관리자 화면의 왼쪽 메뉴(대시보드, 브랜드관, 진료과별 인증서 발행과 설정, 예약 관리, 발행/환자 관리, 구매/주문 관리, 병원 관리, 알림톡, 상담/챗봇 관리, 안내)가 각각 무엇을 하는 곳인지와 메뉴가 보이는 조건을 안내합니다.

[사람이 읽는 원문](https://docs.certi.life/guide/hospital/screens/overview)

Hospital은 병원 담당자가 **인증서를 발행하고, 발행 내역과 환자를 관리하고, 병원 정보를 운영하는** 화면입니다. 로그인하면 `대시보드`가 열리고, 왼쪽 메뉴에서 업무를 고릅니다. 메뉴는 병원의 진료과와 계정의 권한에 따라 다르게 보이므로, 아래 표에 있는 메뉴가 모두 보이지 않아도 정상입니다.

**위치:** Hospital 로그인 후 왼쪽 메뉴

## 메뉴별로 하는 일

| 그룹                                                               | 메뉴                                       | 하는 일                                   | 화면 안내                                                                                                                                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                                                                  | `대시보드`                                   | 발행 현황과 공지, 처리할 일을 한눈에 봅니다              | [대시보드](https://docs.certi.life/guide/hospital/screens/dashboard)                                                                                                                                                 |
| `브랜드관`                                                           | `병원 설정`                                  | 고객에게 보이는 병원 소개 페이지를 꾸밉니다               | [병원 소개 페이지](https://docs.certi.life/guide/hospital/screens/brand-page)                                                                                                                                           |
| 진료과 이름(`치과`, `안과`, `성형외과`, `피부과`, `내과`, `정형외과`, `수의과 인증서`, `병원`) | `인증서 발행`, `인증서 설정`                       | 인증서를 발행하고, 인증서에 들어갈 내용을 미리 설정합니다       | [인증서 발행](https://docs.certi.life/guide/hospital/screens/issue-certificate), [인증서 설정](https://docs.certi.life/guide/hospital/screens/certificate-settings)                                                        |
| `예약 관리`                                                          | `예약 관리`, `후기 관리`                         | 고객의 예약과 후기를 확인하고 처리합니다                 | [예약과 후기](https://docs.certi.life/guide/hospital/screens/reservations-reviews)                                                                                                                                    |
| `발행/환자 관리`                                                       | `발행 내역`, `환자 관리`                         | 발행한 인증서와 환자를 찾아보고 다시 보내거나 고칩니다         | [발행 내역과 환자 관리](https://docs.certi.life/guide/hospital/screens/history)                                                                                                                                           |
| `구매/주문 관리`                                                       | `결제 내역 관리`, `주문 관리`, `전자계약`              | 구매·렌탈 내역과 주문, 계약을 확인합니다                | [주문과 결제](https://docs.certi.life/guide/hospital/screens/orders)                                                                                                                                                  |
| `병원 관리`                                                          | `시술동의서`, `근로계약서`, `병원 정보 관리`, `계정 관리`    | 전자 서명 문서, 병원 정보, 직원 계정을 관리합니다          | [전자 서명 문서](https://docs.certi.life/guide/hospital/screens/contracts), [병원 정보 관리](https://docs.certi.life/guide/hospital/screens/hospital-info), [계정 관리](https://docs.certi.life/guide/hospital/screens/accounts) |
| `알림톡`                                                            | `채널 설정`, `템플릿 조회`, `템플릿 등록`, `템플릿 대량 등록` | 병원 카카오톡 채널로 알림톡을 보내기 위한 채널과 템플릿을 준비합니다 | [알림톡](https://docs.certi.life/guide/hospital/screens/alimtalk)                                                                                                                                                   |
| `상담/챗봇 관리`                                                       | `챗봇 관리`, `상담 관리`, `음성봇 관리`               | Studio를 새 탭으로 엽니다                      | [Studio 메뉴 한눈에 보기](https://docs.certi.life/guide/studio/screens/overview)                                                                                                                                        |
| `안내`                                                             | `사용 가이드`, `공지사항`                         | 사용 가이드와 서비스 공지를 봅니다                    | [대시보드](https://docs.certi.life/guide/hospital/screens/dashboard#공지사항-확인하기)                                                                                                                                       |

화면 왼쪽 위에는 병원 로고와 병원명, 담당자 이름이 보이고, 맨 아래에 `로그아웃`이 있습니다.

## 메뉴가 보이는 조건

**위치:** Hospital 왼쪽 메뉴

- **진료과:** 진료과 그룹은 병원에 등록된 진료과만 보입니다. 진료과가 여러 개인 병원은 그룹이 여러 개 보입니다. `병원` 그룹은 진료과와 관계없이 쓰는 공통 인증서입니다.
- **권한:** 직원용 서브계정은 [계정 관리](https://docs.certi.life/guide/hospital/screens/accounts)에서 받은 권한의 메뉴만 보입니다. 필요한 메뉴가 없다면 병원의 관리자 계정 담당자에게 권한을 요청하세요.
- **안과:** 안과는 "인증서" 대신 \*\*"확인서"\*\*라는 말을 쓰고, `확인서 대량 발행` 메뉴가 추가로 있습니다. 대시보드의 문구도 확인서로 바뀝니다.
- **수의과:** `환자 관리`가 `고객관리`로 표시됩니다.
- **치과:** `구매/주문 관리` 그룹은 치과 병원에만 보입니다.
- **알림톡 템플릿:** `채널 설정`에서 채널을 등록하기 전에는 템플릿 메뉴 세 개가 비활성으로 보입니다.

## 하고 싶은 일로 찾기

| 하고 싶은 일                            | 가야 할 화면                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| 환자에게 인증서를 발행해 보내고 싶어요              | [인증서 발행](https://docs.certi.life/guide/hospital/screens/issue-certificate)    |
| 인증서에 들어갈 시술·제품·보증 내용을 미리 넣어 두고 싶어요 | [인증서 설정](https://docs.certi.life/guide/hospital/screens/certificate-settings) |
| 잘못 보낸 인증서를 확인하고 다시 보내고 싶어요         | [발행 내역과 환자 관리](https://docs.certi.life/guide/hospital/screens/history)        |
| 병원 주소나 진료시간, 비밀번호를 바꾸고 싶어요         | [병원 정보 관리](https://docs.certi.life/guide/hospital/screens/hospital-info)      |
| 직원에게 계정을 만들어 주고 싶어요                | [계정 관리](https://docs.certi.life/guide/hospital/screens/accounts)              |
| 병원 카카오톡 채널로 알림톡을 보내고 싶어요           | [알림톡](https://docs.certi.life/guide/hospital/screens/alimtalk)                |
| 시술 동의서나 근로계약서에 전자 서명을 받고 싶어요       | [전자 서명 문서](https://docs.certi.life/guide/hospital/screens/contracts)          |
| 챗봇이나 채팅 상담을 설정하고 싶어요               | [Studio 메뉴 한눈에 보기](https://docs.certi.life/guide/studio/screens/overview)     |

## Studio 안에서 열었을 때

Studio의 [`인증서` 메뉴](https://docs.certi.life/guide/studio/screens/certificates)로 들어오면 같은 화면이 Studio 안에 열립니다. 메뉴와 기능은 같고, 로그인과 로그아웃만 Studio가 맡습니다. 달라지는 점은 Studio의 인증서 안내에 정리되어 있습니다.

## 함께 보기

- [Hospital 운영 가이드](https://docs.certi.life/guide/hospital/overview)
- [Hospital 계정과 로그인](https://docs.certi.life/guide/hospital/account-access)
- [안전한 Hospital 운영](https://docs.certi.life/guide/hospital/safe-operation)
