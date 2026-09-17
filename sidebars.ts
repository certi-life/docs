import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    'intro',
    {
      type: 'category',
      label: '시작하기',
      collapsed: false,
      items: [
        'getting-started/quick-tour',
        'getting-started/choose-guide',
        'getting-started/plans-and-contact',
        'getting-started/buyer-faq',
        'getting-started/downloads',
        'getting-started/sign-in-directory',
      ],
    },
    {
      type: 'category',
      label: '인증서',
      items: [
        'products/certificate',
        'products/certificate/channels',
        'products/certificate/delivery-checklist',
      ],
    },
    {
      type: 'category',
      label: 'AI 상담',
      items: [
        'products/ai-chatbot',
        'products/ai-chatbot/knowledge-preparation',
        'products/ai-chatbot/message-translation',
        'products/ai-chatbot/handoff-policy',
      ],
    },
    {
      type: 'category',
      label: 'CRM 메시징',
      items: [
        'products/crm-messaging',
        'products/crm-messaging/segment-planning',
        'products/crm-messaging/message-checklist',
      ],
    },
    {
      type: 'category',
      label: '이벤트 마케팅',
      items: [
        'products/event-marketing',
        'products/event-marketing/campaign-planning',
        'products/event-marketing/performance-review',
      ],
    },
    {
      type: 'category',
      label: 'Hospital',
      items: [
        'hospital/overview',
        'hospital/account-access',
        'hospital/certificate-workflow',
        'hospital/safe-operation',
      ],
    },
    {
      type: 'category',
      label: 'Manufacturer',
      items: [
        'manufacturer/overview',
        'manufacturer/account-access',
        'manufacturer/safe-operation',
      ],
    },
    {
      type: 'category',
      label: 'Studio',
      items: [
        'studio/overview',
        'studio/account-access',
        'studio/knowledge-management',
        'studio/scenario-and-handoff',
        'studio/conversation-history',
        'studio/consultation-records',
        'studio/launch-checklist',
        {
          type: 'category',
          label: '화면별 안내',
          items: [
            'studio/screens/chatbot-list',
            'studio/screens/scenarios',
            'studio/screens/flows',
            'studio/screens/statistics',
            'studio/screens/settings',
            'studio/screens/basic-info',
            'studio/screens/ai-settings',
            'studio/screens/tools',
            'studio/screens/manuals',
            'studio/screens/operating-hours',
            'studio/screens/training-materials',
            'studio/screens/channel-settings',
            'studio/screens/chat-window-settings',
            'studio/screens/delete-chatbot',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '도움말',
      items: [
        'help/faq',
        'help/troubleshooting',
        'help/glossary',
        'help/privacy-security',
      ],
    },
  ],
};

export default sidebars;
