export const docsSections = [
  {
    label: '개요',
    description: 'CertiLife의 공개 서비스 범위와 문서 사용법을 먼저 확인합니다.',
    docs: ['intro'],
  },
  {
    label: '시작하기',
    description: '역할·목적별 가이드, 요금과 도입 문의, 다운로드, 로그인 경로를 찾습니다.',
    docs: [
      'getting-started/quick-tour',
      'getting-started/choose-guide',
      'getting-started/plans-and-contact',
      'getting-started/buyer-faq',
      'getting-started/downloads',
      'getting-started/sign-in-directory',
    ],
  },
  {
    label: '인증서',
    description: '디지털 인증서의 유형, 발송 채널, 전달 전 점검 사항을 안내합니다.',
    docs: [
      'products/certificate',
      'products/certificate/channels',
      'products/certificate/delivery-checklist',
    ],
  },
  {
    label: 'AI 상담',
    description: '등록 자료 기반 답변을 위한 지식 준비와 상담원 연결 정책을 안내합니다.',
    docs: [
      'products/ai-chatbot',
      'products/ai-chatbot/knowledge-preparation',
      'products/ai-chatbot/message-translation',
      'products/ai-chatbot/handoff-policy',
    ],
  },
  {
    label: 'CRM 메시징',
    description: '고객군 계획, 메시지 발송 전 점검, 성과 확인 방법을 안내합니다.',
    docs: [
      'products/crm-messaging',
      'products/crm-messaging/segment-planning',
      'products/crm-messaging/message-checklist',
    ],
  },
  {
    label: '이벤트 마케팅',
    description: '이벤트 캠페인 기획과 참여·전환 성과 검토 방법을 안내합니다.',
    docs: [
      'products/event-marketing',
      'products/event-marketing/campaign-planning',
      'products/event-marketing/performance-review',
    ],
  },
  {
    label: 'Hospital',
    description: '병원 관리자의 계정 접근, 인증서 전달, 안전한 운영을 안내합니다.',
    docs: [
      'hospital/overview',
      'hospital/account-access',
      'hospital/certificate-workflow',
      'hospital/safe-operation',
    ],
  },
  {
    label: 'Manufacturer',
    description: '제조사 사용자의 공식 로그인과 안전한 계정 이용 범위를 안내합니다.',
    docs: [
      'manufacturer/overview',
      'manufacturer/account-access',
      'manufacturer/safe-operation',
    ],
  },
  {
    label: 'Studio',
    description: 'AI 상담 지식·시나리오·사람 연결·출시 점검을 준비하는 공개 운영 가이드입니다.',
    docs: [
      'studio/overview',
      'studio/account-access',
      'studio/knowledge-management',
      'studio/scenario-and-handoff',
      'studio/conversation-history',
      'studio/consultation-records',
      'studio/launch-checklist',
    ],
  },
  {
    label: 'Studio 화면별 안내',
    description: 'Studio 왼쪽 메뉴의 위계 그대로, 메뉴마다 무엇을 하는 곳이고 하려는 일을 어떻게 하는지 화면에 보이는 이름으로 안내합니다.',
    docs: [
      'studio/screens/overview',
      'studio/screens/certificates',
      'studio/screens/crm',
      'studio/screens/callbot',
      'studio/screens/counsel',
      'studio/screens/phone-counsel',
      'studio/screens/conversation-history',
      'studio/screens/stats',
      'studio/screens/encyclopedia',
      'studio/screens/ai',
      'studio/screens/org-settings',
    ],
  },
  {
    label: 'Studio 화면별 안내 - 챗봇',
    description: '챗봇 메뉴에서 챗봇을 만들고, 시나리오·플로우·AI 답변을 구성하고, 통계로 보강하는 방법을 목적별로 안내합니다.',
    docs: [
      'studio/screens/chatbot/overview',
      'studio/screens/chatbot/list',
      'studio/screens/chatbot/scenarios',
      'studio/screens/chatbot/flows',
      'studio/screens/chatbot/statistics',
    ],
  },
  {
    label: 'Studio 화면별 안내 - 챗봇 설정',
    description: '챗봇 상세의 설정 탭에서 기본 정보, AI 설정, 도구, 매뉴얼, 작동시간, 학습자료, 채널, 채팅창을 바꾸는 방법을 목적별로 안내합니다.',
    docs: [
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
  {
    label: '도움말',
    description: '자주 묻는 질문, 문제 해결, 용어, 개인정보와 보안 원칙을 확인합니다.',
    docs: [
      'help/faq',
      'help/troubleshooting',
      'help/glossary',
      'help/privacy-security',
    ],
  },
];

export const requiredDocIds = docsSections.flatMap((section) => section.docs);
export const requiredDocs = requiredDocIds.map((id) => `${id}.mdx`);
