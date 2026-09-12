import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const products = [
  {
    number: '01',
    title: '정품 인증서',
    description: '병원에서 시술과 제품 정보를 정품 인증서로 발행하고 환자에게 전달하는 방법을 확인하세요.',
    to: '/guide/products/certificate',
    linkLabel: '인증서 운영 가이드',
    image: '/img/product-certificate.jpg',
    imageAlt: '정품 인증서와 모바일 인증서 화면',
    width: 1920,
    height: 840,
    layout: 'wide',
  },
  {
    number: '02',
    title: 'AI 상담',
    description: '우리 병원 진료·운영 정보를 학습시키고 환자 반복 문의와 사람 연결 기준을 준비하세요.',
    to: '/guide/products/ai-chatbot',
    linkLabel: 'AI 상담 운영 가이드',
    image: '/img/product-ai-chat.png',
    imageAlt: '환자 문의와 CertiLife AI 답변 예시',
    width: 2796,
    height: 2108,
    layout: 'standard',
  },
  {
    number: '03',
    title: 'CRM 메시징',
    description: '인증 환자에게 필요한 안내와 재방문 메시지의 대상·시점을 정리하세요.',
    to: '/guide/products/crm-messaging',
    linkLabel: 'CRM 메시징 가이드',
    image: '/img/product-crm.png',
    imageAlt: '고객에게 발송된 재방문 안내 메시지 예시',
    width: 1204,
    height: 511,
    layout: 'standard',
  },
  {
    number: '04',
    title: '이벤트 마케팅',
    description: '인증 고객을 대상으로 병원 캠페인을 준비하고 현장 운영과 성과 확인까지 이어가세요.',
    to: '/guide/products/event-marketing',
    linkLabel: '이벤트 마케팅 가이드',
    image: '/img/product-event.png',
    imageAlt: '정품 인증 고객에게 발송된 이벤트 안내 예시',
    width: 1647,
    height: 1289,
    layout: 'wide',
  },
];

const hospitalPath = {
  title: '병원 운영',
  description: '로그인부터 인증서 발행, 환자 전달과 안전한 서비스 운영까지',
  to: '/guide/hospital/account-access',
};

const connectedPaths = [
  {title: '제조사·브랜드', description: '제품 정보와 병원 파트너 계정 운영', to: '/guide/manufacturer/account-access'},
  {title: 'Studio 운영팀', description: 'AI 상담 지식과 사람 연결 기준 관리', to: '/guide/studio/knowledge-management'},
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="CertiLife 사용 가이드"
      description="메디컬 인증서를 기반으로 AI 상담, CRM 메시징과 이벤트 운영까지 연결하는 CertiLife 사용 가이드입니다."
    >
      <main className={styles.home}>
        <section className={styles.hero}>
          <div className={`container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <span className={styles.docsLabel}>병원용 CertiLife 가이드</span>
              <Heading as="h1">인증서에서 상담·재방문까지,<br />병원의 고객 경험을 잇습니다</Heading>
              <p>
                CertiLife는 시술·제품 정보를 정품 인증서로 환자에게 전달하고,
                AI 상담과 CRM 메시징으로 관계를 이어가는 병원 고객관리 플랫폼입니다.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} to="/guide/products/certificate">인증서부터 시작하기</Link>
                <Link className={styles.textLink} to="/guide/intro">CertiLife 전체 보기 <span aria-hidden="true">→</span></Link>
              </div>
            </div>

            <figure className={styles.heroProduct}>
              <img
                src="/img/product-certificate-visual.jpg"
                alt="정품 인증서와 모바일 인증서 화면"
                width="890"
                height="840"
                loading="eager"
                fetchPriority="high"
              />
              <figcaption>시술·제품 정보를 고객이 확인할 수 있는 정품 인증서로 전달합니다.</figcaption>
            </figure>
          </div>
        </section>

        <section className={styles.productSection}>
          <div className="container">
            <div className={styles.sectionIntro}>
              <Heading as="h2">CertiLife 제품 운영 가이드</Heading>
              <p>환자에게 인증서를 전달한 뒤 상담, 재방문 관리와 이벤트까지 이어지는 병원 업무를 제품별로 확인하세요.</p>
            </div>

            <div className={styles.productGrid}>
              {products.map((product) => (
                <Link
                  key={product.title}
                  className={`${styles.productCard} ${styles[product.layout]}`}
                  to={product.to}
                >
                  <div className={styles.productImage}>
                    <img
                      src={product.image}
                      alt={product.imageAlt}
                      width={product.width}
                      height={product.height}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.productBody}>
                    <span className={styles.productNumber}>{product.number}</span>
                    <div className={styles.productCopy}>
                      <Heading as="h3">{product.title}</Heading>
                      <p>{product.description}</p>
                    </div>
                    <span className={styles.productLink}>{product.linkLabel} <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.startSection}>
          <div className={`container ${styles.startGrid}`}>
            <div className={styles.startIntro}>
              <Heading as="h2">병원 업무에서 시작하세요</Heading>
              <p>인증서 발행, 상담 준비와 재방문 메시지까지 필요한 순서대로 확인합니다.</p>
              <Link to="/guide/hospital/overview">병원 사용자 가이드 <span aria-hidden="true">→</span></Link>
            </div>
            <nav className={styles.startList} aria-label="역할별 시작 가이드">
              <Link className={`${styles.startItem} ${styles.hospitalPath}`} to={hospitalPath.to}>
                <span>01</span>
                <strong>{hospitalPath.title}</strong>
                <span className={styles.pathDescription}>{hospitalPath.description}</span>
                <span className={styles.pathArrow} aria-hidden="true">↗</span>
              </Link>
              <div className={styles.connectedHeading}>함께 운영하는 경우</div>
              <div className={styles.connectedPaths}>
                {connectedPaths.map((item, index) => (
                  <Link key={item.title} className={styles.connectedItem} to={item.to}>
                    <span>{String(index + 2).padStart(2, '0')}</span>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </section>

        <section className={styles.helpSection}>
          <div className={`container ${styles.helpGrid}`}>
            <div>
              <Heading as="h2">운영 중 막힌 부분이 있나요?</Heading>
              <p>로그인, 인증서 전달, AI 상담 운영 문제를 해결하거나 자주 묻는 질문을 확인하세요.</p>
            </div>
            <div className={styles.helpActions}>
              <Link to="/guide/help/troubleshooting">문제 해결</Link>
              <Link to="/guide/help/faq">자주 묻는 질문</Link>
              <Link className={styles.contactLink} href="https://certi.life/contact">도입 문의 <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
