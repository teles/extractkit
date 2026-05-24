import { readonly, ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 5000
};

const toasts = ref<Toast[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function useToast() {
  function add(toast: Omit<Toast, 'id'>): string {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? DEFAULT_DURATION[toast.type];
    toasts.value = [...toasts.value, { ...toast, id }];

    if (duration > 0) {
      const timer = setTimeout(() => remove(id), duration);
      timers.set(id, timer);
    }

    return id;
  }

  function remove(id: string): void {
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function success(title: string, description?: string): string {
    return add({ type: 'success', title, description });
  }

  function error(title: string, description?: string): string {
    return add({ type: 'error', title, description });
  }

  function info(title: string, description?: string): string {
    return add({ type: 'info', title, description });
  }

  function warning(title: string, description?: string): string {
    return add({ type: 'warning', title, description });
  }

  return {
    toasts: readonly(toasts),
    add,
    remove,
    success,
    error,
    info,
    warning
  };
}
