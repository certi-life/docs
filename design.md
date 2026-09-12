# Design — CertiLife Docs

CertiLife의 공개 사이트와 문서 경험을 하나의 제품군으로 보이게 하는 디자인 기준입니다.

## Genre
Modern-minimal. 장식보다 탐색과 읽기를 우선합니다.

## Audience hierarchy
- Primary: 병원 운영자. Hero, 제품 설명과 기본 시작 경로는 병원·환자 업무를 기준으로 씁니다.
- Secondary: 제조사·브랜드와 Studio 운영팀. Hero의 세일즈 문구가 아니라 역할별 연결 경로에서만 명확히 드러냅니다.
- “병원뿐 아니라 기업도”처럼 범위를 직접 주장하는 문구는 사용하지 않습니다.

## Macrostructure family
- Docs home: Workbench. 시작 경로와 제품 문서를 한 화면에서 비교합니다.
- Content pages: Long Document. 사이드바, 본문, 목차의 읽기 흐름을 유지합니다.

## Theme
- Paper: blue-tinted near-white
- Ink: warm near-black
- Accent: CertiLife blue, active state와 핵심 링크에만 제한
- Secondary surface: quiet cool grey
- Dark surface: footer와 최종 도움말 영역에만 사용

## Typography
- Display and body: `Pretendard Variable`, 400–600
- Code: Docusaurus 기본 monospace
- 한글 제목은 짧고 직접적으로 씁니다.
- 모든 가시 텍스트는 16px 이상입니다.

## Spacing
4px 기반의 named scale을 `tokens.css`에서 사용합니다. 홈 화면은 큰 여백과 조밀한 탐색 목록을 교차해 리듬을 만듭니다.

## Motion
- 진입 애니메이션 없음
- hover는 색·테두리·1px 이동만 사용
- `prefers-reduced-motion`에서 모든 공간 이동 제거

## Microinteractions stance
- 링크와 카드 전체가 동일한 클릭 영역을 가집니다.
- 포커스 링은 즉시 표시합니다.
- 클릭 가능한 문구는 줄바꿈하지 않습니다.

## CTA voice
- Primary: near-black fill, 12px radius, 짧은 동사형 문구
- Secondary: paper surface, visible rule, blue text

## What pages MUST share
- CertiLife 로고와 단일 blue accent
- Pretendard 기반 한글 계층
- 12px 이하의 절제된 radius
- tinted paper, visible rules, no decorative gradient
- 가짜 브라우저·휴대폰 chrome 금지

## What pages MAY differ on
- 홈은 비대칭 탐색 보드 사용
- 문서 본문은 읽기 폭과 목차 밀도를 우선
- 제품별 색상은 작은 marker에만 사용 가능

## Exports
`tokens.css`가 현재 구현의 CSS token 원본입니다.
