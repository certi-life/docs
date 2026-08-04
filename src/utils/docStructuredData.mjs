export function buildTechArticle({title, description, permalink, lastUpdatedAt, siteUrl}) {
  if (typeof title !== 'string' || !title.trim()) throw new Error('TechArticle title is required');
  if (typeof description !== 'string' || !description.trim()) throw new Error('TechArticle description is required');
  if (typeof permalink !== 'string' || !permalink.startsWith('/') || permalink.startsWith('//')) {
    throw new Error('TechArticle permalink must be a site-relative path');
  }
  if (!Number.isFinite(lastUpdatedAt) || lastUpdatedAt <= 0) {
    throw new Error('TechArticle lastUpdatedAt must come from git history');
  }
  const root = new URL(siteUrl);
  const url = new URL(permalink, root);
  if (url.origin !== root.origin) throw new Error('TechArticle permalink must stay on the documentation origin');
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: url.href,
    mainEntityOfPage: url.href,
    inLanguage: 'ko-KR',
    dateModified: new Date(lastUpdatedAt).toISOString(),
  };
}
