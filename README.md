# CertiLife Docs

외부 사용자를 위한 CertiLife 공개 문서 사이트입니다. Docusaurus 3, TypeScript, MDX로 구성되어 있습니다.

## 로컬 실행

```bash
npm install
npm start
```

기본 주소는 `http://localhost:3000/docs/`입니다.

## 검증

```bash
npm run typecheck
npm run build
npm run serve
```

## 콘텐츠 원칙

- 공개 홈페이지 또는 승인된 자료만 근거로 사용합니다.
- 실제 고객·환자·직원 정보와 내부 URL, 계정, 키를 포함하지 않습니다.
- Hospital·Studio 절차는 실제 화면에서 검증한 뒤 게시합니다.
- 예시는 완전한 가상 데이터만 사용합니다.

## 브랜치

- `main`: 공개 배포 기준
- `develop`: 작업 통합 브랜치

GitHub Pages 배포 workflow는 `main` 반영 시 실행됩니다.
