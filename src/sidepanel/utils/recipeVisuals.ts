import {
  Braces,
  FileText,
  Image,
  Link,
  ScrollText,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Type
} from '@lucide/vue';
import type { Component } from 'vue';
import type { RecipeCategory } from '../../shared/types';
import type { IconTone } from '../components/iconTone';

export type RecipeCategoryVisual = {
  icon: Component;
  tone: IconTone;
};

export const recipeCategoryVisuals: Record<RecipeCategory, RecipeCategoryVisual> = {
  seo: {
    icon: SearchCheck,
    tone: 'brand'
  },
  metadata: {
    icon: Tag,
    tone: 'cyan'
  },
  'structured-data': {
    icon: Braces,
    tone: 'violet'
  },
  content: {
    icon: Type,
    tone: 'neutral'
  },
  ecommerce: {
    icon: ShoppingBag,
    tone: 'brand'
  },
  links: {
    icon: Link,
    tone: 'cyan'
  },
  images: {
    icon: Image,
    tone: 'cyan'
  },
  social: {
    icon: ScrollText,
    tone: 'violet'
  },
  qa: {
    icon: ShieldCheck,
    tone: 'success'
  },
  custom: {
    icon: FileText,
    tone: 'neutral'
  }
};
