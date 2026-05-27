import type { Meta, StoryObj } from '@storybook/vue3';
import { runDataToMarkdown } from '../shared/markdown';
import MarkdownPreview from '../sidepanel/components/MarkdownPreview.vue';

// ---------------------------------------------------------------------------
// Pre-render markdown from the same fixture data the app would produce,
// so these stories directly show what the "Readable" tab looks like.
// ---------------------------------------------------------------------------

function md(data: unknown): string {
  return runDataToMarkdown(data);
}

const meta = {
  title: 'Results/MarkdownPreview',
  component: MarkdownPreview,
  tags: ['autodocs'],
  argTypes: {
    markdown: { control: 'text' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MarkdownPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Flat key-value pairs (Page Metadata)
// ---------------------------------------------------------------------------
export const FlatMetadata: Story = {
  name: 'Flat key-value pairs',
  args: {
    markdown: md({
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
      themeColor: '#FA4529',
    }),
  },
};

// ---------------------------------------------------------------------------
// Array of simple objects (Headings Outline)
// ---------------------------------------------------------------------------
export const ArrayOfObjects: Story = {
  name: 'Array of objects — headings',
  args: {
    markdown: md({
      headings: [
        { level: 'H1', text: 'HTML heading elements' },
        { level: 'H2', text: 'Try it' },
        { level: 'H2', text: 'Attributes' },
        { level: 'H3', text: 'Avoid using multiple h1 elements on one page' },
        { level: 'H3', text: 'Navigation' },
        { level: 'H3', text: 'Styling' },
        { level: 'H2', text: 'Examples' },
        { level: 'H3', text: 'All headings' },
        { level: 'H3', text: 'Example page' },
        { level: 'H2', text: 'Technical summary' },
        { level: 'H2', text: 'Browser compatibility' },
        { level: 'H2', text: 'See also' },
      ],
    }),
  },
};

// ---------------------------------------------------------------------------
// Array with URL values (Page Links)
// ---------------------------------------------------------------------------
export const ArrayWithUrls: Story = {
  name: 'Array of objects — links',
  args: {
    markdown: md({
      links: [
        { text: 'Hacker News', href: 'https://news.ycombinator.com/' },
        { text: 'new', href: 'https://news.ycombinator.com/newest' },
        { text: 'past', href: 'https://news.ycombinator.com/front' },
        { text: 'ask', href: 'https://news.ycombinator.com/ask' },
        { text: 'show', href: 'https://news.ycombinator.com/show' },
        { text: 'jobs', href: 'https://news.ycombinator.com/jobs' },
        { text: 'TypeScript 6 brings major performance improvements', href: 'https://devblogs.microsoft.com/typescript/typescript-6/' },
        { text: '', href: 'https://news.ycombinator.com/user?id=pg' },
      ],
    }),
  },
};

// ---------------------------------------------------------------------------
// Array with nulls and mixed content (Image SEO QA)
// ---------------------------------------------------------------------------
export const ArrayWithNulls: Story = {
  name: 'Array with null values — images',
  args: {
    markdown: md({
      imageCount: 5,
      images: [
        { src: 'https://images.unsplash.com/photo-1?w=800', alt: 'Aerial view of mountain range at sunrise', width: '800', height: '534' },
        { src: 'https://images.unsplash.com/photo-2?w=800', alt: '', width: null, height: null },
        { src: 'https://images.unsplash.com/photo-3?w=800', alt: 'Close-up of colorful wildflowers in a meadow', width: '800', height: '600' },
        { src: 'https://images.unsplash.com/photo-4?w=800', alt: '', width: '800', height: '534' },
        { src: 'https://images.unsplash.com/photo-5?w=800', alt: 'Urban skyline at dusk with city lights', width: null, height: null },
      ],
    }),
  },
};

// ---------------------------------------------------------------------------
// Deeply nested JSON (JSON-LD)
// ---------------------------------------------------------------------------
export const NestedObjects: Story = {
  name: 'Nested objects — JSON-LD',
  args: {
    markdown: md({
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
            logo: { '@type': 'ImageObject', url: 'https://schema.org/logo.png' },
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://schema.org' },
            { '@type': 'ListItem', position: 2, name: 'Schemas', item: 'https://schema.org/docs/schemas.html' },
            { '@type': 'ListItem', position: 3, name: 'Event', item: 'https://schema.org/Event' },
          ],
        },
      ],
    }),
  },
};

// ---------------------------------------------------------------------------
// Mixed flat + array (SEO Snapshot)
// ---------------------------------------------------------------------------
export const MixedFlatAndArray: Story = {
  name: 'Mixed flat + null values — SEO Snapshot',
  args: {
    markdown: md({
      title: 'Pricing & Fees',
      description: 'Transparent per-transaction pricing with no setup fees, no monthly fees, and no hidden fees.',
      canonical: 'https://stripe.com/pricing',
      h1: 'Simple, transparent pricing',
      h2Count: 8,
      ogTitle: 'Pricing & Fees – Stripe',
      ogDescription: null,
      ogImage: null,
      twitterCard: 'summary_large_image',
      structuredDataCount: 2,
    }),
  },
};

// ---------------------------------------------------------------------------
// Long text field
// ---------------------------------------------------------------------------
export const LongTextField: Story = {
  name: 'Long text / body content',
  args: {
    markdown: md({
      title: 'Article Title',
      author: 'Jane Smith',
      publishedAt: '2026-05-26',
      body: `TypeScript 6 has been officially released, bringing major improvements to build performance and type inference. The new compiler architecture reduces cold-build times by up to 60% on large monorepos.\n\nThe release includes several long-awaited features:\n- Improved inference for generic callbacks\n- Stricter null handling in optional chaining\n- Native support for decorators (stage 3)\n- A new --isolatedDeclarations flag for incremental builds\n\nMigrating from TypeScript 5.x is straightforward. Most projects will only need to update their tsconfig and run tsc --noEmit to catch any new type errors introduced by the stricter inference rules.`,
    }),
  },
};

// ---------------------------------------------------------------------------
// Empty / no data
// ---------------------------------------------------------------------------
export const EmptyData: Story = {
  name: 'Empty data',
  args: { markdown: md({}) },
};

export const PrimitiveString: Story = {
  name: 'Primitive string',
  args: { markdown: md('Hello, world!') },
};
