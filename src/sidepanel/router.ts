import { createRouter, createWebHashHistory } from 'vue-router';
import type { TranslationKey } from '../shared/i18n';
import HomePage from './pages/HomePage.vue';
import OnboardingPage from './pages/OnboardingPage.vue';
import RecipesPage from './pages/RecipesPage.vue';
import RunsPage from './pages/RunsPage.vue';
import SettingsPage from './pages/SettingsPage.vue';

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    backTo?: string;
    backLabel?: string;
    backLabelKey?: TranslationKey;
    root?: boolean;
  }
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: {
        title: 'Run',
        root: true
      }
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: RecipesPage,
      meta: {
        title: 'Recipes',
        root: true
      }
    },
    {
      path: '/runs',
      name: 'runs',
      component: RunsPage,
      meta: {
        title: 'History',
        root: true
      }
    },
    {
      path: '/data',
      redirect: '/runs'
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage,
      meta: {
        title: 'Settings',
        backTo: '/',
        backLabel: 'Run',
        backLabelKey: 'nav.home'
      }
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingPage,
      meta: {
        title: 'Setup'
      }
    }
  ]
});

export default router;
