# CertiLife Docs

외부 사용자를 위한 CertiLife 공개 문서 사이트입니다. Docusaurus 3, TypeScript, MDX로 구성되어 있습니다.

## 로컬 실행

```bash
npm install
npm start
```

기본 주소는 `http://localhost:3000/`입니다. 현재 공개 배포 주소는 [https://docs.certi.life](https://docs.certi.life)입니다.

GitHub Actions가 `main` 브랜치의 빌드 결과를 GitHub Pages에 배포하며, 커스텀 도메인은 저장소 Pages 설정에서 관리합니다. Docusaurus는 사이트 루트 배포를 위해 `url: 'https://docs.certi.life'`, `baseUrl: '/'`을 사용하고, Pages는 HTTP 요청을 HTTPS로 전환합니다.

## 검증

```bash
npm run docs:check
npm run typecheck
npm run build
npm run search:check
npm run serve
```

## 콘텐츠 원칙

- 공개 홈페이지 또는 승인된 자료만 근거로 사용합니다.
- 실제 고객·환자·직원 정보와 내부 URL, 계정, 키를 포함하지 않습니다.
- Hospital·Studio 절차는 실제 화면에서 검증한 뒤 게시합니다.
- 예시는 완전한 가상 데이터만 사용합니다.
- 외부 URL은 목적이 드러나는 하이퍼링크나 CTA로 제공하며 복사·붙여넣기를 요구하지 않습니다.
- 문서 제목·설명·본문·제목 계층은 전역 검색 대상이므로 사용자가 실제로 찾을 문제·기능 용어를 씁니다.

자세한 작성 규칙은 [기여 가이드](./CONTRIBUTING.md)를 확인하세요.
