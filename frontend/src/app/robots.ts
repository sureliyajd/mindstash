import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.mindstashhq.space';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/profile', '/admin', '/test'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
