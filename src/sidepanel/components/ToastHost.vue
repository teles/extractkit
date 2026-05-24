<script setup lang="ts">
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from '@lucide/vue';
import { useSettings } from '../../composables/useSettings';
import { type ToastType, useToast } from '../../composables/useToast';

const { toasts, remove } = useToast();
const { t } = useSettings();

function borderClass(type: ToastType): string {
  const map: Record<ToastType, string> = {
    success: 'border-success-500/40 dark:border-success-500/30',
    error: 'border-coral-500/40 dark:border-coral-500/30',
    warning: 'border-amberline-500/40 dark:border-amberline-500/30',
    info: 'border-brand-200 dark:border-brand-500/30',
  };
  return map[type];
}

function iconComponent(type: ToastType) {
  const map = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };
  return map[type];
}

function iconClass(type: ToastType): string {
  const map: Record<ToastType, string> = {
    success: 'text-success-500',
    error: 'text-coral-500',
    warning: 'text-amberline-500',
    info: 'text-brand-500',
  };
  return map[type];
}
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed bottom-4 left-16 right-3 z-[100] flex flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white px-3 py-2.5 shadow-lg shadow-ink-200/40 dark:bg-ink-900 dark:shadow-none"
          :class="borderClass(toast.type)"
        >
          <component
            :is="iconComponent(toast.type)"
            class="mt-0.5 h-3.5 w-3.5 shrink-0"
            :class="iconClass(toast.type)"
            :stroke-width="2.2"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-ink-900 dark:text-ink-50">{{ toast.title }}</p>
            <p v-if="toast.description" class="mt-0.5 text-[11px] leading-relaxed text-ink-500">
              {{ toast.description }}
            </p>
          </div>
          <button
            class="shrink-0 rounded p-0.5 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-200"
            :aria-label="t('toast.close')"
            @click="remove(toast.id)"
          >
            <X class="h-3.5 w-3.5" :stroke-width="2" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.18s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(calc(100% + 12px));
}

.toast-move {
  transition: transform 0.18s ease;
}
</style>
