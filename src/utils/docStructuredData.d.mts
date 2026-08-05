export type TechArticleInput = {
  title: string;
  description: string;
  permalink: string;
  lastUpdatedAt: number | null | undefined;
  siteUrl: string;
};

export type TechArticle = {
  '@context': 'https://schema.org';
  '@type': 'TechArticle';
  headline: string;
  description: string;
  url: string;
  mainEntityOfPage: string;
  inLanguage: 'ko-KR';
  dateModified: string;
};

export function buildTechArticle(input: TechArticleInput): TechArticle;

export type FaqEntry = {
  question: string;
  answer: string;
};

export type FaqPage = {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
};

export function buildFaqPage(entries: FaqEntry[] | null | undefined): FaqPage;
