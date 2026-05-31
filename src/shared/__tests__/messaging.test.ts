import { describe, expect, it } from 'vitest';
import {
  CONTENT_DISCOVER_URLS,
  CONTENT_RUN_RECIPE,
  MESSAGE_DISCOVER_URLS,
  MESSAGE_GET_CURRENT_TAB,
  MESSAGE_PAUSE_BATCH_RUN,
  MESSAGE_RESUME_BATCH_RUN,
  MESSAGE_RUN_RECIPE,
  MESSAGE_START_BATCH_RUN,
  MESSAGE_STOP_BATCH_RUN,
  MESSAGE_VIEW_BATCH_TAB,
  isContentMessage,
  isPanelMessage
} from '../messaging';

describe('isPanelMessage', () => {
  for (const type of [
    MESSAGE_GET_CURRENT_TAB,
    MESSAGE_RUN_RECIPE,
    MESSAGE_START_BATCH_RUN,
    MESSAGE_PAUSE_BATCH_RUN,
    MESSAGE_RESUME_BATCH_RUN,
    MESSAGE_STOP_BATCH_RUN,
    MESSAGE_VIEW_BATCH_TAB,
    MESSAGE_DISCOVER_URLS
  ]) {
    it(`accepts ${type}`, () => {
      expect(isPanelMessage({ type })).toBe(true);
    });
  }

  it('rejects malformed values', () => {
    expect(isPanelMessage(null)).toBe(false);
    expect(isPanelMessage('hello')).toBe(false);
    expect(isPanelMessage({ type: 42 })).toBe(false);
    expect(isPanelMessage({ type: 'unknown' })).toBe(false);
  });
});

describe('isContentMessage', () => {
  it('accepts known content messages', () => {
    expect(isContentMessage({ type: CONTENT_RUN_RECIPE })).toBe(true);
    expect(isContentMessage({ type: CONTENT_DISCOVER_URLS })).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isContentMessage({ type: 'other' })).toBe(false);
    expect(isContentMessage(null)).toBe(false);
  });
});
