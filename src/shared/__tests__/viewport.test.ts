import { describe, expect, it } from 'vitest';
import type { UserPreferences } from '../types';
import { resolveProcessingViewport } from '../viewport';

function preferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    theme: 'system',
    locale: 'en-US',
    ...overrides
  };
}

describe('resolveProcessingViewport', () => {
  it('defaults to current-window when no viewport setting is present', () => {
    const result = resolveProcessingViewport(preferences());
    expect(result.source).toBe('current-window');
    expect(result.label).toContain('current window');
    expect(result.width).toBeUndefined();
  });

  it('resolves preset dimensions', () => {
    const result = resolveProcessingViewport(preferences({ processingViewport: { preset: 'desktop-1920x1080' } }));
    expect(result).toMatchObject({ width: 1920, height: 1080, source: 'preset' });
    expect(result.label).toContain('1920');
  });

  it('resolves the mobile preset', () => {
    const result = resolveProcessingViewport(preferences({ processingViewport: { preset: 'mobile-390x844' } }));
    expect(result).toMatchObject({ width: 390, height: 844, source: 'preset' });
  });

  it('resolves custom dimensions', () => {
    const result = resolveProcessingViewport(
      preferences({ processingViewport: { preset: 'custom', customWidth: 800, customHeight: 600 } })
    );
    expect(result).toMatchObject({ width: 800, height: 600, source: 'custom', label: 'Custom' });
  });
});
