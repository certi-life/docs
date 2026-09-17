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
            'studio/screens/overview',
            'studio/screens/certificates',
            {
              type: 'category',
              label: 'CRM',
              items: [
                'studio/screens/crm/overview',
                'studio/screens/crm/calendar',
                'studio/screens/crm/customers',
                'studio/screens/crm/connectors',
                'studio/screens/crm/templates',
                'studio/screens/crm/campaigns',
                'studio/screens/crm/automation',
              ],
            },
            {
              type: 'category',
              label: '챗봇',
              items: [
                'studio/screens/chatbot/overview',
                'studio/screens/chatbot/list',
                'studio/screens/chatbot/scenarios',
                'studio/screens/chatbot/flows',
                'studio/screens/chatbot/statistics',
                {
                  type: 'category',
                  label: '설정',
                  items: [
                    'studio/screens/chatbot/settings/menu',
                    'studio/screens/chatbot/settings/basic-info',
                    'studio/screens/chatbot/settings/ai-settings',
                    'studio/screens/chatbot/settings/tools',
                    'studio/screens/chatbot/settings/manuals',
                    'studio/screens/chatbot/settings/operating-hours',
                    'studio/screens/chatbot/settings/training-materials',
                    'studio/screens/chatbot/settings/channel-settings',
                    'studio/screens/chatbot/settings/chat-window-settings',
                    'studio/screens/chatbot/settings/delete-chatbot',
                  ],
                },
              ],
            },
            {
              type: 'category',
              label: '콜봇',
              items: [
                'studio/screens/callbot/overview',
                'studio/screens/callbot/agents',
                'studio/screens/callbot/agent-settings',
                'studio/screens/callbot/flow-editor',
                'studio/screens/callbot/voices',
                'studio/screens/callbot/tools',
                'studio/screens/callbot/manuals',
                'studio/screens/callbot/knowledge',
                'studio/screens/callbot/campaign',
                'studio/screens/callbot/phone-numbers',
                'studio/screens/callbot/verification',
              ],
            },
            {
              type: 'category',
              label: '상담',
              items: [
                'studio/screens/counsel/overview',
                'studio/screens/counsel/inbox',
                'studio/screens/counsel/handle',
                'studio/screens/counsel/translation',
                'studio/screens/counsel/reply-tools',
                'studio/screens/counsel/customer',
              ],
            },
            'studio/screens/phone-counsel',
            'studio/screens/conversation-history',
            'studio/screens/stats',
            'studio/screens/encyclopedia',
            'studio/screens/ai',
            {
              type: 'category',
              label: '설정',
              items: [
                'studio/screens/org-settings/overview',
                'studio/screens/org-settings/hours',
                'studio/screens/org-settings/alerts',
                'studio/screens/org-settings/translation',
                'studio/screens/org-settings/callback-situations',
                'studio/screens/org-settings/channels',
                'studio/screens/org-settings/auto-messages',
                'studio/screens/org-settings/customer-info',
                'studio/screens/org-settings/file-storage',
                'studio/screens/org-settings/counsel-record',
              ],
            },
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
