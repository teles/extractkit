<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSettings } from '../../composables/useSettings';
import { ensureDefaultRecipes } from '../../shared/default-recipes';
import { getOnboardingState } from '../../shared/storage';
import AppNavigation from './AppNavigation.vue';
import ToastHost from './ToastHost.vue';

const { loadPreferences } = useSettings();
const ready = ref(false);
const router = useRouter();
const route = useRoute();

const isOnboarding = computed(() => route.name === 'onboarding');

onMounted(async () => {
  const [, onboardingState] = await Promise.all([loadPreferences(), getOnboardingState()]);

  if (!onboardingState.completed) {
    await router.replace('/onboarding');
    ready.value = true;
    return;
  }

  await ensureDefaultRecipes();
  ready.value = true;
});
</script>

<template>
  <div class="min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-900 dark:text-ink-50">
    <ToastHost />
    <template v-if="!isOnboarding">
      <AppNavigation />
    </template>
    <div :class="isOnboarding ? 'min-h-screen' : 'min-h-screen pt-14 pb-[72px]'">
      <main v-if="ready" :class="isOnboarding ? '' : 'mx-auto min-w-0 max-w-full px-4 py-5'">
        <RouterView />
      </main>
      <main v-else class="mx-auto min-w-0 max-w-full px-4 py-5">
        <div class="rounded-lg border border-ink-200 bg-white p-3 text-sm font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
          Loading ExtractKit...
        </div>
      </main>
    </div>
  </div>
</template>
