import type { Meta, StoryObj } from '@storybook/vue3';
import JsonPreview from '../sidepanel/components/JsonPreview.vue';

const meta = {
  title: 'Results/JsonPreview',
  component: JsonPreview,
  tags: ['autodocs'],
  argTypes: {
    compact: { control: 'boolean' },
    tone: { control: 'radio', options: ['light', 'dark'] }
  },
  parameters: { layout: 'padded' }
} satisfies Meta<typeof JsonPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FlatObject: Story = {
  args: {
    value: {
      title: 'Page Metadata',
      description: 'Transparent per-transaction pricing.',
      canonical: 'https://stripe.com/pricing',
      robots: 'index, follow',
      viewport: 'width=device-width, initial-scale=1',
      charset: 'UTF-8',
      language: 'en'
    }
  }
};

export const ArrayOfObjects: Story = {
  args: {
    value: {
      headings: [
        { level: 'H1', text: 'HTML heading elements' },
        { level: 'H2', text: 'Try it' },
        { level: 'H2', text: 'Attributes' },
        { level: 'H3', text: 'Avoid using multiple h1 elements on one page' },
        { level: 'H2', text: 'Usage notes' },
        { level: 'H2', text: 'Examples' },
        { level: 'H3', text: 'All headings' },
        { level: 'H2', text: 'Technical summary' },
        { level: 'H2', text: 'Browser compatibility' }
      ]
    }
  }
};

export const NestedStructure: Story = {
  args: {
    value: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Introduction to Structured Data',
      datePublished: '2026-01-15',
      author: { '@type': 'Person', name: 'Jane Smith' },
      publisher: {
        '@type': 'Organization',
        name: 'Schema.org',
        logo: { '@type': 'ImageObject', url: 'https://schema.org/logo.png' }
      }
    }
  }
};

export const MixedNullsAndValues: Story = {
  args: {
    value: {
      imageCount: 12,
      images: [
        { src: 'https://images.unsplash.com/photo-1?w=800', alt: 'Mountain sunrise', width: '800', height: '534' },
        { src: 'https://images.unsplash.com/photo-2?w=800', alt: '', width: null, height: null },
        { src: 'https://images.unsplash.com/photo-3?w=800', alt: 'Wildflowers', width: '800', height: '600' },
        { src: 'https://images.unsplash.com/photo-4?w=800', alt: '', width: '800', height: '534' }
      ]
    }
  }
};

export const EmptyObject: Story = { args: { value: {} } };
export const NullValue: Story = { args: { value: null } };

export const Compact: Story = {
  args: {
    compact: true,
    value: {
      title: 'Compact preview',
      description: 'This preview uses less vertical space.',
      canonical: 'https://example.com'
    }
  }
};
