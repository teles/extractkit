import type { BatchRun } from './types';

export function batchDisplayName(
  batch: (Pick<BatchRun, 'createdAt'> & { name?: string }) | null | undefined,
  fallbackLabel = 'Batch run',
  locale = 'en-US'
): string {
  if (batch?.name?.trim()) {
    return batch.name.trim();
  }

  if (!batch?.createdAt) {
    return fallbackLabel;
  }

  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(batch.createdAt));

  return `${fallbackLabel} · ${date}`;
}
