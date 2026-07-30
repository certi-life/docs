import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    'intro',
    {
      type: 'category',
      label: '시작하기',
      collapsed: false,
      items: ['getting-started/quick-tour'],
    },
    {
      type: 'category',
      label: '서비스 소개',
      items: [
        'products/certificate',
        'products/ai-chatbot',
        'products/crm-messaging',
        'products/event-marketing',
      ],
    },
    {
      type: 'category',
      label: 'Hospital',
      items: ['hospital/overview'],
    },
    {
      type: 'category',
      label: 'Studio',
      items: ['studio/overview'],
    },
    {
      type: 'category',
      label: '도움말',
      items: ['help/faq', 'help/privacy-security'],
    },
    {
      type: 'category',
      label: '업데이트',
      items: ['releases/index'],
    },
  ],
};

export default sidebars;
