import React from 'react';
import { siteConfig } from '@/lib/siteConfig';

export default function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.brand.url}/#website`,
    name: siteConfig.brand.name,
    alternateName: [siteConfig.brand.alternateName, siteConfig.brand.legalName],
    url: siteConfig.brand.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.brand.url}/inventory?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
