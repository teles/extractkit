import { createRouter, createWebHashHistory } from 'vue-router';
import HomePage from './pages/HomePage.vue';
import RecipesPage from './pages/RecipesPage.vue';
import RunsPage from './pages/RunsPage.vue';
import SettingsPage from './pages/SettingsPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: RecipesPage
    },
    {
      path: '/runs',
      name: 'runs',
      component: RunsPage
    },
    {
      path: '/data',
      redirect: '/runs'
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage
    }
  ]
});

export default router;
