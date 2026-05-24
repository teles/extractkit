import { listRecipes, saveRecipe } from './storage';
import type { Recipe, RecipeCheck } from './types';

const now = '2026-05-23T00:00:00.000Z';

function field(
  id: string,
  key: string,
  selector: string,
  extract: Recipe['fields'][number] extends infer Field
    ? Field extends { kind: 'field'; extract: infer Extract }
      ? Extract
      : never
    : never,
  extra: Partial<Extract<Recipe['fields'][number], { kind: 'field' }>> = {}
): Extract<Recipe['fields'][number], { kind: 'field' }> {
  return {
    id,
    kind: 'field',
    key,
    selector,
    extract,
    required: false,
    ...extra
  };
}

function check(
  id: string,
  name: string,
  selector: string,
  assertion: RecipeCheck['assertion'],
  extra: Partial<Omit<RecipeCheck, 'id' | 'name' | 'selector' | 'assertion'>> = {}
): RecipeCheck {
  return {
    id,
    name,
    selector,
    assertion,
    severity: 'info',
    ...extra
  };
}

export function getDefaultRecipes(): Recipe[] {
  const recipes: Recipe[] = [
    {
      id: 'default-page-metadata',
      name: 'Page Metadata',
      description: 'Extracts basic metadata from any web page.',
      category: 'metadata',
      tags: ['metadata', 'seo', 'head'],
      source: 'default',
      urlPatterns: ['*'],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      fields: [
        field('default-page-metadata-document-title', 'documentTitle', 'title', 'text'),
        field('default-page-metadata-meta-description', 'metaDescription', 'meta[name="description"]', 'attribute', {
          attribute: 'content'
        }),
        field('default-page-metadata-canonical', 'canonical', 'link[rel="canonical"]', 'attribute', {
          attribute: 'href',
          transforms: ['absoluteUrl']
        }),
        field('default-page-metadata-robots', 'robots', 'meta[name="robots"]', 'attribute', { attribute: 'content' })
      ]
    },
    {
      id: 'default-open-graph-tags',
      name: 'Open Graph Tags',
      description: 'Extracts Open Graph and Twitter social preview tags.',
      category: 'social',
      tags: ['open-graph', 'twitter', 'social', 'metadata'],
      source: 'default',
      urlPatterns: ['*'],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      fields: [
        field('default-og-title', 'ogTitle', 'meta[property="og:title"]', 'attribute', { attribute: 'content' }),
        field('default-og-description', 'ogDescription', 'meta[property="og:description"]', 'attribute', {
          attribute: 'content'
        }),
        field('default-og-image', 'ogImage', 'meta[property="og:image"]', 'attribute', {
          attribute: 'content',
          transforms: ['absoluteUrl']
        }),
        field('default-og-url', 'ogUrl', 'meta[property="og:url"]', 'attribute', {
          attribute: 'content',
          transforms: ['absoluteUrl']
        }),
        field('default-twitter-title', 'twitterTitle', 'meta[name="twitter:title"]', 'attribute', {
          attribute: 'content'
        }),
        field('default-twitter-description', 'twitterDescription', 'meta[name="twitter:description"]', 'attribute', {
          attribute: 'content'
        }),
        field('default-twitter-image', 'twitterImage', 'meta[name="twitter:image"]', 'attribute', {
          attribute: 'content',
          transforms: ['absoluteUrl']
        })
      ]
    },
    {
      id: 'default-headings-outline',
      name: 'Headings Outline',
      description: 'Extracts the visible heading structure from a page.',
      category: 'content',
      tags: ['headings', 'outline', 'content', 'seo'],
      source: 'default',
      urlPatterns: ['*'],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      fields: [
        {
          id: 'default-headings-outline-headings',
          kind: 'group',
          key: 'headings',
          selector: 'h1, h2, h3, h4, h5, h6',
          multiple: true,
          fields: [
            field('default-headings-outline-level', 'level', ':scope', 'tagName'),
            field('default-headings-outline-text', 'text', ':scope', 'text', {
              transforms: ['trim', 'removeExtraSpaces']
            })
          ]
        }
      ]
    },
    {
      id: 'default-page-links',
      name: 'Page Links',
      description: 'Extracts links from the current page.',
      category: 'links',
      tags: ['links', 'internal-links', 'external-links'],
      source: 'default',
      urlPatterns: ['*'],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      fields: [
        {
          id: 'default-page-links-links',
          kind: 'group',
          key: 'links',
          selector: 'a[href]',
          multiple: true,
          fields: [
            field('default-page-links-text', 'text', ':scope', 'text', {
              transforms: ['trim', 'removeExtraSpaces']
            }),
            field('default-page-links-href', 'href', ':scope', 'attribute', {
              attribute: 'href',
              transforms: ['absoluteUrl']
            })
          ]
        }
      ],
      checks: [
        check(
          'default-page-links-href-check',
          'Links should have href attributes',
          'a',
          {
            type: 'missingAttributeCountEquals',
            attribute: 'href',
            value: 0
          },
          {
            description: 'Anchor elements should have href attributes when they are intended to be links.'
          }
        )
      ]
    },
    {
      id: 'default-page-images',
      name: 'Page Images',
      description: 'Extracts image URLs and alt text from the current page.',
      category: 'images',
      tags: ['images', 'alt', 'media', 'seo'],
      source: 'default',
      urlPatterns: ['*'],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      fields: [
        {
          id: 'default-page-images-images',
          kind: 'group',
          key: 'images',
          selector: 'img',
          multiple: true,
          fields: [
            field('default-page-images-src', 'src', ':scope', 'attribute', {
              attribute: 'src',
              transforms: ['absoluteUrl']
            }),
            field('default-page-images-alt', 'alt', ':scope', 'attribute', {
              attribute: 'alt',
              transforms: ['trim']
            }),
            field('default-page-images-loading', 'loading', ':scope', 'attribute', { attribute: 'loading' })
          ]
        }
      ],
      checks: [
        check(
          'default-page-images-alt-check',
          'Images should have alt attributes',
          'img',
          {
            type: 'missingAttributeCountEquals',
            attribute: 'alt',
            value: 0
          },
          {
            description: 'Images should not be missing the alt attribute.'
          }
        ),
        check(
          'default-page-images-empty-alt-check',
          'Images should not have empty alt text',
          'img[alt]',
          {
            type: 'emptyAttributeCountEquals',
            attribute: 'alt',
            value: 0
          },
          {
            description:
              'Images with an alt attribute should usually not have empty alt text unless they are decorative.'
          }
        )
      ]
    },
    {
      id: 'default-json-ld-structured-data',
      name: 'JSON-LD Structured Data',
      description: 'Extracts JSON-LD structured data scripts from a page.',
      category: 'structured-data',
      tags: ['json-ld', 'schema', 'structured-data', 'seo'],
      source: 'default',
      urlPatterns: ['*'],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      fields: [
        field('default-json-ld-structured-data-json-ld', 'jsonLd', 'script[type="application/ld+json"]', 'json', {
          multiple: true,
          required: false
        })
      ],
      checks: [
        check(
          'check-json-ld-exists',
          'JSON-LD exists',
          'script[type="application/ld+json"]',
          {
            type: 'exists'
          },
          {
            description:
              'The page should include at least one JSON-LD structured data script for this recipe to extract.'
          }
        )
      ]
    },
    {
      id: 'default-seo-snapshot',
      name: 'SEO Snapshot',
      description: 'Extracts a quick SEO overview from the current page.',
      category: 'seo',
      tags: ['seo', 'metadata', 'headings', 'schema', 'links'],
      source: 'default',
      urlPatterns: ['*'],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      fields: [
        field('default-seo-snapshot-document-title', 'documentTitle', 'title', 'text', { transforms: ['trim'] }),
        field('default-seo-snapshot-meta-description', 'metaDescription', 'meta[name="description"]', 'attribute', {
          attribute: 'content',
          transforms: ['trim']
        }),
        field('default-seo-snapshot-canonical', 'canonical', 'link[rel="canonical"]', 'attribute', {
          attribute: 'href',
          transforms: ['absoluteUrl']
        }),
        field('default-seo-snapshot-robots', 'robots', 'meta[name="robots"]', 'attribute', { attribute: 'content' }),
        field('default-seo-snapshot-h1', 'h1', 'h1', 'text', {
          multiple: true,
          transforms: ['trim', 'removeExtraSpaces']
        }),
        field('default-seo-snapshot-json-ld', 'jsonLd', 'script[type="application/ld+json"]', 'json', {
          multiple: true
        }),
        field('default-seo-snapshot-links-count', 'linksCount', 'a[href]', 'count'),
        field('default-seo-snapshot-images-count', 'imagesCount', 'img', 'count')
      ],
      checks: [
        check(
          'check-title-exists',
          'Title tag exists',
          'title',
          { type: 'exists' },
          {
            description: 'The page should have a title tag.',
            severity: 'warning'
          }
        ),
        check(
          'check-meta-description-exists',
          'Meta description exists',
          'meta[name="description"]',
          { type: 'exists' },
          {
            description: 'The page should have a meta description.'
          }
        ),
        check(
          'check-canonical-exists',
          'Canonical tag exists',
          'link[rel="canonical"]',
          { type: 'exists' },
          {
            description: 'The page should have a canonical link tag.'
          }
        ),
        check(
          'check-single-h1',
          'Exactly one H1',
          'h1',
          { type: 'countEquals', value: 1 },
          {
            description: 'The page should usually have exactly one H1.',
            severity: 'warning'
          }
        )
      ]
    },
    {
      id: 'default-image-seo-qa',
      name: 'Image SEO QA',
      description: 'Checks image alt text and dimensions for basic image SEO quality.',
      category: 'qa',
      tags: ['images', 'seo', 'qa', 'alt'],
      source: 'default',
      urlPatterns: ['*'],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      fields: [
        field('default-image-seo-qa-image-count', 'imageCount', 'img', 'count'),
        {
          id: 'default-image-seo-qa-images',
          kind: 'group',
          key: 'images',
          selector: 'img',
          multiple: true,
          fields: [
            field('default-image-seo-qa-src', 'src', ':scope', 'attribute', {
              attribute: 'src',
              transforms: ['absoluteUrl']
            }),
            field('default-image-seo-qa-alt', 'alt', ':scope', 'attribute', {
              attribute: 'alt',
              transforms: ['trim']
            }),
            field('default-image-seo-qa-width', 'width', ':scope', 'attribute', { attribute: 'width' }),
            field('default-image-seo-qa-height', 'height', ':scope', 'attribute', { attribute: 'height' })
          ]
        }
      ],
      checks: [
        check(
          'check-images-without-alt',
          'Images should have alt attributes',
          'img',
          {
            type: 'missingAttributeCountEquals',
            attribute: 'alt',
            value: 0
          },
          {
            description: 'Images should not be missing the alt attribute.',
            severity: 'warning'
          }
        ),
        check(
          'check-images-with-empty-alt',
          'Images should not have empty alt text',
          'img[alt]',
          {
            type: 'emptyAttributeCountEquals',
            attribute: 'alt',
            value: 0
          },
          {
            description:
              'Images with an alt attribute should usually not have empty alt text unless they are decorative.'
          }
        ),
        check(
          'check-images-without-width',
          'Images should have width attributes',
          'img',
          {
            type: 'missingAttributeCountEquals',
            attribute: 'width',
            value: 0
          },
          {
            description: 'Images should include width attributes when possible to reduce layout shifts.',
            severity: 'warning'
          }
        ),
        check(
          'check-images-without-height',
          'Images should have height attributes',
          'img',
          {
            type: 'missingAttributeCountEquals',
            attribute: 'height',
            value: 0
          },
          {
            description: 'Images should include height attributes when possible to reduce layout shifts.',
            severity: 'warning'
          }
        )
      ]
    }
  ];

  return structuredClone(recipes);
}

function isDefaultRecipeRecord(existingRecipe: Recipe, defaultRecipe: Recipe): boolean {
  return (
    existingRecipe.source === 'default' ||
    (existingRecipe.id === defaultRecipe.id &&
      existingRecipe.name === defaultRecipe.name &&
      existingRecipe.version === defaultRecipe.version)
  );
}

function mergeMissingDefaultChecks(existingRecipe: Recipe, defaultRecipe: Recipe): Recipe | null {
  const defaultChecks = defaultRecipe.checks ?? [];
  if (defaultChecks.length === 0 || !isDefaultRecipeRecord(existingRecipe, defaultRecipe)) {
    return null;
  }

  const existingCheckIds = new Set((existingRecipe.checks ?? []).map((check) => check.id));
  const missingChecks = defaultChecks.filter((check) => !existingCheckIds.has(check.id));
  if (missingChecks.length === 0) {
    return null;
  }

  return {
    ...existingRecipe,
    source: 'default',
    checks: [...(existingRecipe.checks ?? []), ...structuredClone(missingChecks)]
  };
}

async function restoreMissingDefaultChecks(existingRecipes: Recipe[], defaultRecipes: Recipe[]): Promise<number> {
  const defaultsById = new Map(defaultRecipes.map((recipe) => [recipe.id, recipe]));
  let restoredCount = 0;

  for (const existingRecipe of existingRecipes) {
    const defaultRecipe = defaultsById.get(existingRecipe.id);
    if (!defaultRecipe) {
      continue;
    }

    const mergedRecipe = mergeMissingDefaultChecks(existingRecipe, defaultRecipe);
    if (!mergedRecipe) {
      continue;
    }

    await saveRecipe(mergedRecipe);
    restoredCount += 1;
  }

  return restoredCount;
}

export async function restoreDefaultRecipes(): Promise<number> {
  const existingRecipes = await listRecipes();
  const existingIds = new Set(existingRecipes.map((recipe) => recipe.id));
  const defaultRecipes = getDefaultRecipes();
  let restoredCount = 0;

  for (const recipe of defaultRecipes) {
    if (existingIds.has(recipe.id)) {
      continue;
    }

    await saveRecipe(recipe);
    restoredCount += 1;
  }

  return restoredCount + (await restoreMissingDefaultChecks(existingRecipes, defaultRecipes));
}

export async function ensureDefaultRecipes(): Promise<void> {
  const recipes = await listRecipes();
  if (recipes.length === 0) {
    await restoreDefaultRecipes();
    return;
  }

  await restoreMissingDefaultChecks(recipes, getDefaultRecipes());
}
