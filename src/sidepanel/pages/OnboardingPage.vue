<script setup lang="ts">
import { Check, ChevronRight } from '@lucide/vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import { ensureSelectedDefaultRecipes, getDefaultRecipes } from '../../shared/default-recipes';
import { completeOnboarding, skipOnboarding } from '../../shared/storage';
import type { Recipe } from '../../shared/types';
import Badge from '../components/Badge.vue';
import Button from '../components/Button.vue';

const RECOMMENDED_IDS = [
  'default-seo-snapshot',
  'default-page-metadata',
  'default-json-ld-structured-data',
  'default-image-seo-qa',
  'default-headings-outline'
];

const router = useRouter();
const { t } = useSettings();
const { success: toastSuccess, info: toastInfo } = useToast();

const step = ref<1 | 2>(1);
const installing = ref(false);
const starterRecipes = ref<Recipe[]>([]);
const selectedIds = ref<Set<string>>(new Set(RECOMMENDED_IDS));

onMounted(() => {
  const defaults = getDefaultRecipes();
  const validRecommended = new Set(RECOMMENDED_IDS.filter((id) => defaults.some((r) => r.id === id)));
  starterRecipes.value = defaults;
  selectedIds.value = validRecommended;
});

function toggleRecipe(id: string): void {
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  selectedIds.value = next;
}

function selectRecommended(): void {
  const validRecommended = new Set(
    RECOMMENDED_IDS.filter((id) => starterRecipes.value.some((r) => r.id === id))
  );
  selectedIds.value = validRecommended;
}

async function install(ids: string[]): Promise<void> {
  installing.value = true;
  try {
    await ensureSelectedDefaultRecipes(ids);
    await completeOnboarding(ids);
    toastSuccess(t('toast.starterInstalled'));
    await router.replace('/');
  } finally {
    installing.value = false;
  }
}

async function installSelected(): Promise<void> {
  await install(Array.from(selectedIds.value));
}

async function installRecommended(): Promise<void> {
  selectRecommended();
  await install(Array.from(selectedIds.value));
}

async function skip(): Promise<void> {
  await skipOnboarding();
  toastInfo(t('toast.setupSkipped'));
  await router.replace('/');
}

function getCategoryLabel(recipe: Recipe): string {
  const key = `recipe.category.${recipe.category}` as Parameters<typeof t>[0];
  return t(key);
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ink-50 dark:bg-ink-900">
    <!-- Header -->
    <header class="flex h-14 items-center border-b border-ink-200 bg-white px-4 dark:border-ink-800 dark:bg-ink-950">
      <div class="flex min-w-0 items-center gap-2">
        <img src="/icons/extractkit-icon.svg" alt="" class="h-7 w-7" />
        <span class="truncate text-lg font-semibold">
          <span class="text-ink-900 dark:text-ink-50">Extract</span><span class="text-brand-700 dark:text-brand-400">Kit</span>
        </span>
      </div>
    </header>

    <!-- Step indicator -->
    <div class="flex items-center gap-1.5 border-b border-ink-200 bg-white px-4 py-2.5 dark:border-ink-800 dark:bg-ink-950">
      <button
        type="button"
        class="h-1.5 rounded-full transition-all"
        :class="step === 1 ? 'w-5 bg-brand-600 dark:bg-brand-400' : 'w-1.5 bg-ink-200 dark:bg-ink-700'"
        aria-hidden="true"
      />
      <button
        type="button"
        class="h-1.5 rounded-full transition-all"
        :class="step === 2 ? 'w-5 bg-brand-600 dark:bg-brand-400' : 'w-1.5 bg-ink-200 dark:bg-ink-700'"
        aria-hidden="true"
      />
    </div>

    <!-- Step 1: Welcome -->
    <main v-if="step === 1" class="mx-auto w-full max-w-full flex-1 px-4 py-6">
      <div class="space-y-5">
        <div>
          <h1 class="text-xl font-semibold text-ink-900 dark:text-ink-50">
            {{ t('onboarding.welcomeTitle') }}
          </h1>
          <p class="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
            {{ t('onboarding.welcomeSubtitle') }}
          </p>
        </div>

        <ul class="space-y-2">
          <li
            v-for="hint in [t('onboarding.welcomeHint1'), t('onboarding.welcomeHint2'), t('onboarding.welcomeHint3')]"
            :key="hint"
            class="flex items-start gap-2.5 rounded-lg border border-ink-200 bg-white p-3 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-200"
          >
            <Check class="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" :stroke-width="2.5" aria-hidden="true" />
            <span>{{ hint }}</span>
          </li>
        </ul>

        <div class="space-y-2">
          <Button variant="primary" block @click="step = 2">
            {{ t('onboarding.getStarted') }}
            <ChevronRight class="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" block :disabled="installing" @click="skip">
            {{ t('onboarding.skip') }}
          </Button>
        </div>
      </div>
    </main>

    <!-- Step 2: Choose starter recipes -->
    <main v-else class="mx-auto w-full max-w-full flex-1 px-4 py-6">
      <div class="space-y-4">
        <div>
          <h1 class="text-xl font-semibold text-ink-900 dark:text-ink-50">
            {{ t('onboarding.starterTitle') }}
          </h1>
          <p class="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
            {{ t('onboarding.starterSubtitle') }}
          </p>
        </div>

        <ul class="space-y-1.5">
          <li
            v-for="recipe in starterRecipes"
            :key="recipe.id"
            class="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 transition hover:border-brand-300 dark:bg-ink-950 dark:hover:border-brand-600"
            :class="
              selectedIds.has(recipe.id)
                ? 'border-brand-400 dark:border-brand-500'
                : 'border-ink-200 dark:border-ink-700'
            "
            role="checkbox"
            :aria-checked="selectedIds.has(recipe.id)"
            tabindex="0"
            @click="toggleRecipe(recipe.id)"
            @keydown.space.prevent="toggleRecipe(recipe.id)"
            @keydown.enter.prevent="toggleRecipe(recipe.id)"
          >
            <!-- Checkbox -->
            <span
              class="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition"
              :class="
                selectedIds.has(recipe.id)
                  ? 'border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500'
                  : 'border-ink-300 bg-white dark:border-ink-600 dark:bg-ink-900'
              "
              aria-hidden="true"
            >
              <Check
                v-if="selectedIds.has(recipe.id)"
                class="h-3 w-3 text-white"
                :stroke-width="3"
              />
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                <span class="text-sm font-medium text-ink-900 dark:text-ink-50">{{ recipe.name }}</span>
                <Badge variant="accent" size="xs">{{ getCategoryLabel(recipe) }}</Badge>
              </div>
              <p v-if="recipe.description" class="mt-0.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                {{ recipe.description }}
              </p>
            </div>
          </li>
        </ul>

        <div class="space-y-2">
          <Button
            variant="primary"
            block
            :disabled="installing || selectedIds.size === 0"
            @click="installSelected"
          >
            {{ t('onboarding.installSelected') }}
          </Button>
          <Button
            variant="secondary"
            block
            :disabled="installing"
            @click="installRecommended"
          >
            {{ t('onboarding.installRecommended') }}
          </Button>
          <div class="flex gap-2">
            <Button variant="ghost" block :disabled="installing" @click="step = 1">
              {{ t('onboarding.back') }}
            </Button>
            <Button variant="ghost" block :disabled="installing" @click="skip">
              {{ t('onboarding.skipForNow') }}
            </Button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
