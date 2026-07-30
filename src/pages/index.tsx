import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const products = [
  {eyebrow: 'CERTIFICATE', title: '인증서', description: '시술과 제품 정보를 고객에게 안전하고 간편하게 전달하세요.', to: '/guide/products/certificate', tone: 'blue'},
  {eyebrow: 'AI SOLUTION', title: 'AI 상담', description: '반복되는 채팅 상담은 AI에게 맡기고 중요한 고객 경험에 집중하세요.', to: '/guide/products/ai-chatbot', tone: 'dark'},
  {eyebrow: 'CRM MARKETING', title: 'CRM 메시징', description: '고객에게 필요한 메시지를 적절한 시점에 전달해 재방문을 이어가세요.', to: '/guide/products/crm-messaging', tone: 'yellow'},
  {eyebrow: 'BRAND EXPERIENCE', title: '이벤트 마케팅', description: '고객별 경험을 연결하고 브랜드와 병원의 접점을 확장하세요.', to: '/guide/products/event-marketing', tone: 'coral'},
];

const journeys = [
  {number: '01', title: '서티라이프 둘러보기', description: '제품 구성과 역할별 시작점을 먼저 확인합니다.', to: '/guide/getting-started/quick-tour'},
  {number: '02', title: 'Hospital 시작하기', description: '병원 사용자를 위한 기본 가이드를 확인합니다.', to: '/guide/hospital/overview'},
  {number: '03', title: 'Studio 시작하기', description: 'Studio 가이드와 공개 예정 범위를 확인합니다.', to: '/guide/studio/overview'},
];

export default function Home(): ReactNode {
  return (
    <Layout title="CertiLife 사용 가이드" description="인증서부터 AI 상담, CRM 마케팅까지 CertiLife의 서비스와 사용법을 확인하세요.">
      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className="container">
            <div className={styles.heroContent}>
              <span className={styles.badge}>CERTILIFE USER GUIDE</span>
              <Heading as="h1">더 신뢰받는 병원 경험,<br /><strong>서티라이프로 시작하세요.</strong></Heading>
              <p>인증서부터 AI 상담, CRM 마케팅까지.<br className={styles.desktopBreak} /> 필요한 기능을 이해하고 바로 시작할 수 있도록 안내합니다.</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} to="/guide/intro">가이드 시작하기 <span>→</span></Link>
                <Link className={styles.secondaryButton} href="https://certi.life/contact">도입 문의하기</Link>
              </div>
            </div>
            <div className={styles.heroVisual} aria-hidden="true">
              <div className={styles.mockWindow}>
                <div className={styles.mockTop}><i /><i /><i /><span>CertiLife</span></div>
                <div className={styles.mockBody}>
                  <div className={styles.mockSide}><b /><b /><b /><b /></div>
                  <div className={styles.mockMain}>
                    <small>오늘의 고객 경험</small>
                    <strong>한눈에 보고,<br />쉽게 이어가세요.</strong>
                    <div className={styles.mockStats}><i /><i /><i /></div>
                    <div className={styles.mockChart} />
                  </div>
                </div>
              </div>
              <div className={styles.phone}><span /><b>정품 인증서</b><small>안전하게 전달되었어요</small><i>확인하기</i></div>
            </div>
          </div>
        </section>

        <section className={styles.journeySection}>
          <div className="container">
            <div className={styles.sectionHeader}><span>QUICK START</span><Heading as="h2">어디서 시작할까요?</Heading><p>내 역할과 목적에 맞는 가이드를 선택하세요.</p></div>
            <div className={styles.journeyGrid}>{journeys.map((item) => <Link key={item.number} className={styles.journeyCard} to={item.to}><span>{item.number}</span><div><Heading as="h3">{item.title}</Heading><p>{item.description}</p></div><b>→</b></Link>)}</div>
          </div>
        </section>

        <section className={styles.productSection}>
          <div className="container">
            <div className={styles.sectionHeader}><span>ALL-IN-ONE MEDICAL PLATFORM</span><Heading as="h2">병원과 고객을 잇는<br />CertiLife의 주요 서비스</Heading></div>
            <div className={styles.productGrid}>{products.map((product) => <Link key={product.title} className={`${styles.productCard} ${styles[product.tone]}`} to={product.to}><span>{product.eyebrow}</span><Heading as="h3">{product.title}</Heading><p>{product.description}</p><b>자세히 보기 →</b><i aria-hidden="true" /></Link>)}</div>
          </div>
        </section>

        <section className={styles.helpSection}>
          <div className="container"><div><span>NEED HELP?</span><Heading as="h2">궁금한 점을 빠르게 해결하세요.</Heading><p>자주 묻는 질문에서 답을 찾거나, 도입 상담을 요청할 수 있습니다.</p></div><div className={styles.helpActions}><Link to="/guide/help/faq">자주 묻는 질문</Link><Link href="https://certi.life/contact">도입 문의 →</Link></div></div>
        </section>
      </main>
    </Layout>
  );
}
