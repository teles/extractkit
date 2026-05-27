import type { OutputValidationResult, RecipeChecksResult, RecipeRun } from '../shared/types';

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

const noChecks: RecipeChecksResult = {
  status: 'skipped',
  passed: 0,
  warnings: 0,
  errors: 0,
  skipped: 0,
  results: []
};

const checksAllPassed: RecipeChecksResult = {
  status: 'passed',
  passed: 3,
  warnings: 0,
  errors: 0,
  skipped: 0,
  results: [
    {
      id: 'chk-1',
      name: 'Page has exactly one H1',
      status: 'passed',
      severity: 'error',
      selector: 'h1',
      assertion: { type: 'countEquals', value: 1 },
      actual: 1,
      expected: '1'
    },
    {
      id: 'chk-2',
      name: 'Page has at least one H2',
      status: 'passed',
      severity: 'warning',
      selector: 'h2',
      assertion: { type: 'countGreaterThan', value: 0 },
      actual: 5,
      expected: '> 0'
    },
    {
      id: 'chk-3',
      name: 'All headings have text',
      status: 'passed',
      severity: 'warning',
      selector: 'h1, h2, h3',
      assertion: { type: 'eachElementMustHave', selector: ':scope' }
    }
  ]
};

const checksWithWarnings: RecipeChecksResult = {
  status: 'warning',
  passed: 2,
  warnings: 1,
  errors: 0,
  skipped: 0,
  results: [
    {
      id: 'chk-1',
      name: 'All images have alt text',
      status: 'failed',
      severity: 'warning',
      selector: 'img',
      assertion: { type: 'emptyAttributeCountEquals', attribute: 'alt', value: 0 },
      actual: 4,
      expected: '0',
      message: '4 images are missing alt attributes'
    },
    {
      id: 'chk-2',
      name: 'Page has at least one image',
      status: 'passed',
      severity: 'info',
      selector: 'img',
      assertion: { type: 'countGreaterThan', value: 0 },
      actual: 12,
      expected: '> 0'
    },
    {
      id: 'chk-3',
      name: 'Images have explicit dimensions',
      status: 'passed',
      severity: 'info',
      selector: 'img',
      assertion: { type: 'eachElementShouldHave', selector: '[width][height]' }
    }
  ]
};

const checksWithErrors: RecipeChecksResult = {
  status: 'error',
  passed: 1,
  warnings: 1,
  errors: 2,
  skipped: 0,
  results: [
    {
      id: 'chk-1',
      name: 'Page has exactly one H1',
      status: 'failed',
      severity: 'error',
      selector: 'h1',
      assertion: { type: 'countEquals', value: 1 },
      actual: 0,
      expected: '1',
      message: 'Expected exactly 1 but found 0'
    },
    {
      id: 'chk-2',
      name: 'Canonical link present',
      status: 'failed',
      severity: 'error',
      selector: 'link[rel="canonical"]',
      assertion: { type: 'exists' },
      message: 'No canonical link found'
    },
    {
      id: 'chk-3',
      name: 'Meta description present',
      status: 'failed',
      severity: 'warning',
      selector: 'meta[name="description"]',
      assertion: { type: 'exists' },
      message: 'Meta description is missing'
    },
    {
      id: 'chk-4',
      name: 'Page has at least one link',
      status: 'passed',
      severity: 'info',
      selector: 'a[href]',
      assertion: { type: 'countGreaterThan', value: 0 },
      actual: 42,
      expected: '> 0'
    }
  ]
};

const validationPassed: OutputValidationResult = {
  status: 'valid',
  issues: []
};

const validationFailed: OutputValidationResult = {
  status: 'invalid',
  issues: [
    { path: '/title', message: 'must be string', keyword: 'type' },
    {
      path: '/ogImage',
      message: 'must match format "uri"',
      keyword: 'format'
    },
    { path: '/canonical', message: 'must not be null', keyword: 'not' }
  ]
};

const validationSkipped: OutputValidationResult = {
  status: 'skipped',
  issues: []
};

// ---------------------------------------------------------------------------
// Run fixtures
// ---------------------------------------------------------------------------

export const runHeadingsOutline: RecipeRun = {
  id: 'run-headings-1',
  recipeId: 'default-headings-outline',
  recipeVersion: '1.0.0',
  recipeName: 'Headings Outline',
  url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements',
  domain: 'developer.mozilla.org',
  pageTitle: 'Heading Elements – MDN Web Docs',
  status: 'success',
  createdAt: '2026-05-26T10:30:00.000Z',
  durationMs: 312,
  data: {
    headings: [
      { level: 'H1', text: 'HTML heading elements' },
      { level: 'H2', text: 'Try it' },
      { level: 'H2', text: 'Attributes' },
      { level: 'H2', text: 'Usage notes' },
      { level: 'H3', text: 'Avoid using multiple h1 elements on one page' },
      { level: 'H3', text: 'Navigation' },
      { level: 'H3', text: 'Styling' },
      { level: 'H2', text: 'Examples' },
      { level: 'H3', text: 'All headings' },
      { level: 'H3', text: 'Example page' },
      { level: 'H2', text: 'Technical summary' },
      { level: 'H2', text: 'Specifications' },
      { level: 'H2', text: 'Browser compatibility' },
      { level: 'H2', text: 'See also' }
    ]
  },
  checks: checksAllPassed,
  validation: validationPassed,
  warnings: [],
  errors: []
};

export const runPageMetadata: RecipeRun = {
  id: 'run-meta-1',
  recipeId: 'default-page-metadata',
  recipeVersion: '1.0.0',
  recipeName: 'Page Metadata',
  url: 'https://www.theverge.com/2026/5/26/ai-news',
  domain: 'theverge.com',
  pageTitle: 'AI News – The Verge',
  status: 'success',
  createdAt: '2026-05-26T11:00:00.000Z',
  durationMs: 198,
  data: {
    title: 'The Verge',
    description:
      'The Verge is the definitive guide to technology in all its forms, including how technology intersects with culture, science, politics, and human connection.',
    canonical: 'https://www.theverge.com/',
    robots: 'index, follow',
    viewport: 'width=device-width, initial-scale=1',
    charset: 'UTF-8',
    language: 'en',
    author: null,
    generator: null,
    themeColor: '#FA4529'
  },
  checks: noChecks,
  validation: validationPassed,
  warnings: [],
  errors: []
};

export const runImageSeoQa: RecipeRun = {
  id: 'run-img-1',
  recipeId: 'default-image-seo-qa',
  recipeVersion: '1.0.0',
  recipeName: 'Image SEO QA',
  url: 'https://unsplash.com/photos',
  domain: 'unsplash.com',
  pageTitle: 'Unsplash – Beautiful Free Photos',
  status: 'partial',
  createdAt: '2026-05-26T09:15:00.000Z',
  durationMs: 542,
  data: {
    imageCount: 12,
    images: [
      {
        src: 'https://images.unsplash.com/photo-1748123456789?w=800',
        alt: 'Aerial view of mountain range at sunrise',
        width: '800',
        height: '534'
      },
      {
        src: 'https://images.unsplash.com/photo-1748234567890?w=800',
        alt: '',
        width: null,
        height: null
      },
      {
        src: 'https://images.unsplash.com/photo-1748345678901?w=800',
        alt: 'Close-up of colorful wildflowers in a meadow',
        width: '800',
        height: '600'
      },
      {
        src: 'https://images.unsplash.com/photo-1748456789012?w=800',
        alt: '',
        width: '800',
        height: '534'
      },
      {
        src: 'https://images.unsplash.com/photo-1748567890123?w=800',
        alt: 'Urban skyline at dusk with city lights',
        width: null,
        height: null
      }
    ]
  },
  checks: checksWithWarnings,
  validation: validationSkipped,
  warnings: [
    { field: 'images[1].alt', message: 'Alt text is empty' },
    { field: 'images[3].alt', message: 'Alt text is empty' },
    { field: 'images[1].width', message: 'Width attribute is missing' },
    { field: 'images[1].height', message: 'Height attribute is missing' }
  ],
  errors: []
};

export const runPageLinks: RecipeRun = {
  id: 'run-links-1',
  recipeId: 'default-page-links',
  recipeVersion: '1.0.0',
  recipeName: 'Page Links',
  url: 'https://news.ycombinator.com',
  domain: 'news.ycombinator.com',
  pageTitle: 'Hacker News',
  status: 'success',
  createdAt: '2026-05-26T08:45:00.000Z',
  durationMs: 267,
  data: {
    links: [
      { text: 'Hacker News', href: 'https://news.ycombinator.com/' },
      { text: 'new', href: 'https://news.ycombinator.com/newest' },
      { text: 'past', href: 'https://news.ycombinator.com/front' },
      { text: 'comments', href: 'https://news.ycombinator.com/newcomments' },
      { text: 'ask', href: 'https://news.ycombinator.com/ask' },
      { text: 'show', href: 'https://news.ycombinator.com/show' },
      { text: 'jobs', href: 'https://news.ycombinator.com/jobs' },
      { text: 'submit', href: 'https://news.ycombinator.com/submit' },
      {
        text: 'TypeScript 6 brings major performance improvements',
        href: 'https://devblogs.microsoft.com/typescript/typescript-6/'
      },
      {
        text: '247 points',
        href: 'https://news.ycombinator.com/item?id=44123456'
      },
      {
        text: 'Why we rebuilt our CLI from scratch using Rust',
        href: 'https://blog.example.com/rust-cli'
      },
      {
        text: '189 points',
        href: 'https://news.ycombinator.com/item?id=44123457'
      },
      { text: '', href: 'https://news.ycombinator.com/user?id=pg' }
    ]
  },
  checks: noChecks,
  validation: validationSkipped,
  warnings: [{ field: 'links[12].text', message: 'Link text is empty' }],
  errors: []
};

export const runJsonLd: RecipeRun = {
  id: 'run-jsonld-1',
  recipeId: 'default-json-ld-structured-data',
  recipeVersion: '1.0.0',
  recipeName: 'JSON-LD Structured Data',
  url: 'https://schema.org/Event',
  domain: 'schema.org',
  pageTitle: 'Event – Schema.org',
  status: 'success',
  createdAt: '2026-05-26T12:00:00.000Z',
  durationMs: 145,
  data: {
    items: [
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Introduction to Structured Data',
        datePublished: '2026-01-15',
        author: { '@type': 'Person', name: 'Jane Smith' },
        publisher: {
          '@type': 'Organization',
          name: 'Schema.org',
          logo: {
            '@type': 'ImageObject',
            url: 'https://schema.org/logo.png'
          }
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://schema.org/Event' }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://schema.org' },
          { '@type': 'ListItem', position: 2, name: 'Schemas', item: 'https://schema.org/docs/schemas.html' },
          { '@type': 'ListItem', position: 3, name: 'Event', item: 'https://schema.org/Event' }
        ]
      }
    ]
  },
  checks: noChecks,
  validation: validationSkipped,
  warnings: [],
  errors: []
};

export const runSeoSnapshot: RecipeRun = {
  id: 'run-seo-1',
  recipeId: 'default-seo-snapshot',
  recipeVersion: '1.0.0',
  recipeName: 'SEO Snapshot',
  url: 'https://stripe.com/pricing',
  domain: 'stripe.com',
  pageTitle: 'Pricing & Fees – Stripe',
  status: 'partial',
  createdAt: '2026-05-26T13:30:00.000Z',
  durationMs: 891,
  data: {
    title: 'Pricing & Fees',
    description: 'Transparent per-transaction pricing with no setup fees, no monthly fees, and no hidden fees.',
    canonical: 'https://stripe.com/pricing',
    h1: 'Simple, transparent pricing',
    h2Count: 8,
    ogTitle: 'Pricing & Fees – Stripe',
    ogDescription: null,
    ogImage: null,
    twitterCard: 'summary_large_image',
    twitterTitle: 'Stripe Pricing',
    structuredDataCount: 2
  },
  checks: checksWithErrors,
  validation: validationFailed,
  warnings: [],
  errors: [
    { field: 'ogImage', message: 'OG image is missing' },
    { field: 'ogDescription', message: 'OG description is missing' }
  ]
};

export const runError: RecipeRun = {
  id: 'run-error-1',
  recipeId: 'default-page-metadata',
  recipeVersion: '1.0.0',
  recipeName: 'Page Metadata',
  url: 'https://example.com/404-page',
  domain: 'example.com',
  pageTitle: undefined,
  status: 'error',
  createdAt: '2026-05-26T07:00:00.000Z',
  durationMs: 12000,
  data: {},
  checks: noChecks,
  validation: validationSkipped,
  warnings: [],
  errors: [
    { message: 'Page navigation timed out after 12 seconds' },
    { field: 'title', message: 'Selector not found: title' }
  ]
};

// Convenience groupings
export const allRuns = [
  runHeadingsOutline,
  runPageMetadata,
  runImageSeoQa,
  runPageLinks,
  runJsonLd,
  runSeoSnapshot,
  runError
] as const;

export const checksFixtures = {
  noChecks,
  allPassed: checksAllPassed,
  withWarnings: checksWithWarnings,
  withErrors: checksWithErrors
} as const;

export const validationFixtures = {
  passed: validationPassed,
  failed: validationFailed,
  skipped: validationSkipped
} as const;
