import type { ProcessingViewportPreset, ResolvedProcessingViewport, UserPreferences } from './types';

type ViewportDimensions = { width: number; height: number };

const PRESET_DIMENSIONS: Record<Exclude<ProcessingViewportPreset, 'current-window' | 'custom'>, ViewportDimensions> = {
  'desktop-1366x768': { width: 1366, height: 768 },
  'desktop-1440x900': { width: 1440, height: 900 },
  'desktop-1920x1080': { width: 1920, height: 1080 },
  'tablet-768x1024': { width: 768, height: 1024 },
  'mobile-390x844': { width: 390, height: 844 }
};

const PRESET_LABELS: Record<ProcessingViewportPreset, string> = {
  'current-window': 'Use current window size',
  'desktop-1366x768': 'Desktop 1366 × 768',
  'desktop-1440x900': 'Desktop 1440 × 900',
  'desktop-1920x1080': 'Desktop 1920 × 1080',
  'tablet-768x1024': 'Tablet 768 × 1024',
  'mobile-390x844': 'Mobile 390 × 844',
  custom: 'Custom'
};

export function resolveProcessingViewport(preferences: UserPreferences): ResolvedProcessingViewport {
  const settings = preferences.processingViewport ?? { preset: 'current-window' };
  const { preset } = settings;

  if (preset === 'current-window') {
    return { source: 'current-window', label: PRESET_LABELS['current-window'] };
  }

  if (preset === 'custom') {
    const { customWidth, customHeight } = settings;
    return {
      width: customWidth,
      height: customHeight,
      source: 'custom',
      label: PRESET_LABELS.custom
    };
  }

  const dims = PRESET_DIMENSIONS[preset as keyof typeof PRESET_DIMENSIONS];
  return {
    width: dims.width,
    height: dims.height,
    source: 'preset',
    label: PRESET_LABELS[preset]
  };
}
