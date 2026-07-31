import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CertiLife Docs',
  tagline: '인증서부터 AI 상담, CRM 마케팅까지',
  favicon: 'img/certilife-symbol.svg',
  future: {v4: true},
  url: 'https://certi-life.github.io',
  baseUrl: '/docs/',
  organizationName: 'certi-life',
  projectName: 'docs',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
    localeConfigs: {ko: {label: '한국어', htmlLang: 'ko-KR'}},
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'guide',
          sidebarPath: './sidebars.ts',
          showLastUpdateAuthor: false,
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {customCss: './src/css/custom.css'},
        sitemap: {changefreq: 'weekly', priority: 0.5},
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    metadata: [
      {name: 'keywords', content: '서티라이프, CertiLife, 인증서, AI 상담, CRM, 병원 고객관리'},
    ],
    colorMode: {defaultMode: 'light', disableSwitch: true, respectPrefersColorScheme: false},
    navbar: {
      title: 'Docs',
      logo: {alt: 'CertiLife', src: 'img/certilife-logo.png', width: 86, height: 30},
      items: [
        {type: 'docSidebar', sidebarId: 'guideSidebar', position: 'left', label: '사용 가이드'},
        {to: '/guide/products/certificate', label: '서비스 소개', position: 'left'},
        {to: '/guide/help/faq', label: '도움말', position: 'left'},
        {href: 'https://hospital.certi.life/signin', label: '병원용 로그인', position: 'right'},
        {href: 'https://certi.life/contact', label: '도입 문의', position: 'right', className: 'navbar-cta'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {title: '시작하기', items: [
          {label: 'CertiLife 소개', to: '/guide/intro'},
          {label: '내 가이드 찾기', to: '/guide/getting-started/choose-guide'},
          {label: '다운로드', to: '/guide/getting-started/downloads'},
          {label: '로그인 바로가기', to: '/guide/getting-started/sign-in-directory'},
        ]},
        {title: '제품', items: [
          {label: '인증서', to: '/guide/products/certificate'},
          {label: 'AI 상담', to: '/guide/products/ai-chatbot'},
          {label: 'CRM 메시징', to: '/guide/products/crm-messaging'},
          {label: '이벤트 마케팅', to: '/guide/products/event-marketing'},
        ]},
        {title: '지원', items: [
          {label: '문제 해결', to: '/guide/help/troubleshooting'},
          {label: '자주 묻는 질문', to: '/guide/help/faq'},
          {label: '개인정보 및 보안', to: '/guide/help/privacy-security'},
          {label: '도입 문의', href: 'https://certi.life/contact'},
        ]},
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CertiLife.`,
    },
    prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula},
  } satisfies Preset.ThemeConfig,
};

export default config;
