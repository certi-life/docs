import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {PageMetadata} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {buildTechArticle} from '../../../utils/docStructuredData.mjs';

export default function DocItemMetadata(): ReactNode {
  const {metadata, frontMatter, assets, contentTitle} = useDoc();
  const {siteConfig} = useDocusaurusContext();
  const techArticle = buildTechArticle({
    title: contentTitle ?? metadata.title,
    description: metadata.description,
    permalink: metadata.permalink,
    lastUpdatedAt: metadata.lastUpdatedAt,
    siteUrl: siteConfig.url,
  });
  return (
    <>
      <PageMetadata
        title={metadata.title}
        description={metadata.description}
        keywords={frontMatter.keywords}
        image={assets.image ?? frontMatter.image}
      />
      <Head>
        <script type="application/ld+json">{JSON.stringify(techArticle)}</script>
      </Head>
    </>
  );
}
