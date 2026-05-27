<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Compass,
  ExternalLink,
  FileUp,
  Link2,
  ListChecks,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Square,
  Trash2,
  X
} from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBatchRuns } from '../../composables/useBatchRuns';
import { useCurrentTab } from '../../composables/useCurrentTab';
import { useExport } from '../../composables/useExport';
import { useRuns } from '../../composables/useRuns';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import { batchDisplayName } from '../../shared/batch-display';
import {
  createBatchPlan,
  DEFAULT_BATCH_RUN_OPTIONS,
  normalizeUrlInput,
  validateBatchUrl
} from '../../shared/batch-planner';
import type { TranslationKey } from '../../shared/i18n';
import { MESSAGE_DISCOVER_URLS, type UrlDiscoveryResponse } from '../../shared/messaging';
import type {
  BatchRun,
  BatchRunEvent,
  BatchRunOptions,
  Recipe,
  RecipeCategory,
  UrlDiscoveryCounts,
  UrlDiscoveryItem,
  UrlDiscoveryOptions,
  UrlDiscoveryStatus
} from '../../shared/types';
import { DEFAULT_URL_DISCOVERY_OPTIONS } from '../../shared/url-discovery';
import Badge from './Badge.vue';
import Button from './Button.vue';
import Card from './Card.vue';

const props = defineProps<{
  recipes: Recipe[];
}>();

type UrlAppendSummary = {
  importedUrls: number;
  duplicatesSkipped: number;
  invalidUrlsIgnored: number;
  unsupportedUrlsIgnored: number;
};

type OpenTabCandidate = {
  id: number;
  title: string;
  url: string;
  domain: string;
  supported: boolean;
  selected: boolean;
  reason?: string;
};

type DiscoveryReviewItem = UrlDiscoveryItem & {
  selected: boolean;
};

const router = useRouter();
const { t, preferences } = useSettings();
const { success: toastSuccess, error: toastError } = useToast();
const {
  currentTab: discoveryCurrentTab,
  loading: discoverySourceLoading,
  error: discoverySourceError,
  refreshCurrentTab: refreshDiscoverySource
} = useCurrentTab();
const {
  batchRuns,
  error,
  running,
  loadBatchRuns,
  startBatchRun,
  pauseBatchRun,
  resumeBatchRun,
  stopBatchRun,
  viewProcessingTab
} = useBatchRuns();
const { runs, loadRuns } = useRuns();
const { exporting, error: exportError, exportRuns } = useExport();

const batchName = ref('');
const previewCreatedAt = ref(new Date().toISOString());
const urlsText = ref('');
const selectedRecipeIds = ref<string[]>([]);
const advancedOpen = ref(false);
const activeBatchId = ref<string | null>(null);
const options = ref<BatchRunOptions>({
  ...DEFAULT_BATCH_RUN_OPTIONS,
  skipHttpErrorPages:
    preferences.value.batchDefaults?.skipHttpErrorPages ?? DEFAULT_BATCH_RUN_OPTIONS.skipHttpErrorPages,
  skipHttpStatusCodes: [...(DEFAULT_BATCH_RUN_OPTIONS.skipHttpStatusCodes ?? [])]
});
const fileInput = ref<HTMLInputElement | null>(null);
const importSummary = ref<UrlAppendSummary | null>(null);
const openTabsPanelOpen = ref(false);
const openTabsLoading = ref(false);
const openTabsError = ref<string | null>(null);
const openTabs = ref<OpenTabCandidate[]>([]);
const currentWindowOnly = ref(true);
const sameDomainOnly = ref(false);
const activeTabDomain = ref<string | null>(null);
const discoverPanelOpen = ref(false);
const discoveryLoading = ref(false);
const discoveryError = ref<string | null>(null);
const discoveryRan = ref(false);
const discoverySourceUrl = ref('');
const discoverySourceTitle = ref('');
const discoverySearch = ref('');
const discoveryOptions = ref<UrlDiscoveryOptions>({ ...DEFAULT_URL_DISCOVERY_OPTIONS });
const discoveryCounts = ref<UrlDiscoveryCounts | null>(null);
const discoveryItems = ref<DiscoveryReviewItem[]>([]);

let pollingId: number | undefined;

const urlInput = computed(() => normalizeUrlInput(urlsText.value));
const selectedRecipes = computed(() => props.recipes.filter((recipe) => selectedRecipeIds.value.includes(recipe.id)));
const plan = computed(() => createBatchPlan(urlInput.value.validUrls, selectedRecipes.value, options.value));
const previewBatchName = computed(() =>
  batchName.value.trim() || batchDisplayName({ name: undefined, createdAt: previewCreatedAt.value }, t('batch.batchRun'), preferences.value.locale)
);
const visibleOpenTabs = computed(() =>
  openTabs.value.filter((tab) => !sameDomainOnly.value || (activeTabDomain.value && tab.domain === activeTabDomain.value))
);
const selectedOpenTabCount = computed(() => visibleOpenTabs.value.filter((tab) => tab.supported && tab.selected).length);
const discoverySourceDisplay = computed(() => discoverySourceUrl.value || discoveryCurrentTab.value?.url || '');
const discoverySourceSupported = computed(() => validateBatchUrl(discoverySourceDisplay.value).ok);
const selectedDiscoveryCount = computed(
  () => discoveryItems.value.filter((item) => item.status === 'discovered' && item.selected).length
);
const visibleDiscoveryItems = computed(() => {
  const query = discoverySearch.value.trim().toLowerCase();
  if (!query) {
    return discoveryItems.value;
  }

  return discoveryItems.value.filter(
    (item) =>
      item.url.toLowerCase().includes(query) ||
      item.text?.toLowerCase().includes(query) ||
      discoveryStatusLabel(item.status).toLowerCase().includes(query)
  );
});
const activeStoredBatch = computed(
  () => batchRuns.value.find((batch) => batch.status === 'running' || batch.status === 'paused') ?? null
);
const activeBatch = computed(() => batchRuns.value.find((batch) => batch.id === activeBatchId.value) ?? activeStoredBatch.value);
const currentEvent = computed(() => {
  const events = activeBatch.value?.events ?? [];
  return [...events].reverse().find((event) => event.status === 'running') ?? null;
});
const currentBatchUrl = computed(() => {
  const batch = activeBatch.value;
  if (!batch) {
    return '—';
  }

  return currentEvent.value?.url ?? batch.urls[batch.currentUrlIndex ?? 0] ?? batch.urls[0] ?? '—';
});
const recentEvents = computed(() => [...(activeBatch.value?.events ?? [])].reverse().slice(0, 6));
const batchRunsForExport = computed(() =>
  activeBatch.value ? runs.value.filter((run) => run.batchId === activeBatch.value?.id) : []
);
const progressPercent = computed(() => {
  const batch = activeBatch.value;
  if (!batch || batch.totalPlannedRuns === 0) {
    return 0;
  }

  return Math.min(100, Math.round((batch.completedRuns / batch.totalPlannedRuns) * 100));
});
const hasProcessingTabClosed = computed(
  () =>
    activeBatch.value?.pauseReason === 'processing-tab-closed' ||
    (activeBatch.value?.events.some((event) => event.message === 'Processing tab was closed') ?? false)
);
const canStart = computed(
  () =>
    urlInput.value.validUrls.length > 0 &&
    selectedRecipes.value.length > 0 &&
    plan.value.totalPlannedRuns > 0 &&
    !running.value &&
    !activeStoredBatch.value
);

const delaySeconds = computed({
  get: () => Math.round(options.value.delayBetweenUrlsMs / 1000),
  set: (value: number) => {
    options.value.delayBetweenUrlsMs = Math.max(0, value) * 1000;
  }
});
const pageLoadTimeoutSeconds = computed({
  get: () => Math.round(options.value.pageLoadTimeoutMs / 1000),
  set: (value: number) => {
    options.value.pageLoadTimeoutMs = Math.max(1, value) * 1000;
  }
});
const waitAfterLoadSeconds = computed({
  get: () => Math.round(options.value.waitAfterLoadMs / 1000),
  set: (value: number) => {
    options.value.waitAfterLoadMs = Math.max(0, value) * 1000;
  }
});

const urlErrorOptions: Array<{ value: BatchRunOptions['onUrlError']; labelKey: TranslationKey }> = [
  { value: 'retryThenSkip', labelKey: 'batch.onUrlError.retryThenSkip' },
  { value: 'skip', labelKey: 'batch.onUrlError.skip' },
  { value: 'stop', labelKey: 'batch.onUrlError.stop' }
];
const recipeErrorOptions: Array<{ value: BatchRunOptions['onRecipeError']; labelKey: TranslationKey }> = [
  { value: 'continue', labelKey: 'batch.onRecipeError.continue' },
  { value: 'skipRecipe', labelKey: 'batch.onRecipeError.skipRecipe' },
  { value: 'stop', labelKey: 'batch.onRecipeError.stop' }
];

onMounted(async () => {
  await loadBatchRuns();
  activeBatchId.value = activeStoredBatch.value?.id ?? null;
  pollingId = window.setInterval(loadBatchRuns, 1500);
});

onUnmounted(() => {
  if (pollingId) {
    window.clearInterval(pollingId);
  }
});

function countRecipeFields(recipe: Recipe): number {
  return recipe.fields.reduce((total, field) => total + (field.kind === 'group' ? field.fields.length + 1 : 1), 0);
}

function categoryLabel(category: RecipeCategory): string {
  return t(`recipe.category.${category}` as TranslationKey);
}

function patternSummary(recipe: Recipe): string {
  if (recipe.urlPatterns.length === 1 && recipe.urlPatterns[0] === '*') {
    return t('recipes.allWebsites');
  }

  return recipe.urlPatterns[0] ?? '*';
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }

  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function batchDuration(batch: BatchRun): string {
  const end = batch.completedAt ? new Date(batch.completedAt).getTime() : Date.now();
  const start = new Date(batch.startedAt ?? batch.createdAt).getTime();
  return formatDuration(Math.max(0, end - start));
}

function displayBatchName(batch: Pick<BatchRun, 'name' | 'createdAt'> | null | undefined): string {
  return batchDisplayName(batch, t('batch.batchRun'), preferences.value.locale);
}

function eventDuration(event: BatchRunEvent): string | null {
  if (!event.startedAt || !event.completedAt) {
    return null;
  }

  return formatDuration(new Date(event.completedAt).getTime() - new Date(event.startedAt).getTime());
}

function eventVariant(event: BatchRunEvent): 'neutral' | 'success' | 'warning' | 'danger' | 'accent' {
  if (event.status === 'success') {
    return 'success';
  }

  if (event.status === 'warning') {
    return 'warning';
  }

  if (event.status === 'failed') {
    return 'danger';
  }

  if (event.status === 'running') {
    return 'accent';
  }

  return 'neutral';
}

function eventTitle(event: BatchRunEvent): string {
  if (event.errorKind === 'http-error' && event.status === 'skipped') {
    return t('batch.skippedHttpErrorPage');
  }

  if (event.errorKind === 'navigation-error') {
    return t('batch.navigationFailed');
  }

  if (event.errorKind === 'timeout') {
    return t('batch.pageLoadTimeout');
  }

  if (event.errorKind === 'injection-error') {
    return t('batch.injectionFailed');
  }

  if (event.errorKind === 'no-compatible-recipes') {
    return t('batch.noCompatibleRecipes');
  }

  return event.recipeName ?? event.message ?? t('batch.batchRun');
}

function batchVariant(status: BatchRun['status']): 'neutral' | 'success' | 'warning' | 'danger' | 'accent' {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'running') {
    return 'accent';
  }

  if (status === 'paused') {
    return 'warning';
  }

  if (status === 'cancelled') {
    return 'warning';
  }

  if (status === 'failed') {
    return 'danger';
  }

  return 'neutral';
}

function toggleRecipe(recipeId: string, checked: boolean): void {
  selectedRecipeIds.value = checked
    ? Array.from(new Set([...selectedRecipeIds.value, recipeId]))
    : selectedRecipeIds.value.filter((id) => id !== recipeId);
}

function domainFromUrl(value: string | undefined): string {
  if (!value) {
    return '';
  }

  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
}

function queryBrowserTabs(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      const chromeError = chrome.runtime.lastError;
      if (chromeError) {
        reject(new Error(chromeError.message));
        return;
      }

      resolve(tabs);
    });
  });
}

function appendUrlCandidates(candidates: string[], appendOptions: { skipDuplicates?: boolean } = {}): UrlAppendSummary {
  const skipDuplicates = appendOptions.skipDuplicates ?? true;
  const existingUrls = new Set(urlInput.value.validUrls);
  const addedUrls: string[] = [];
  let duplicatesSkipped = 0;
  let invalidUrlsIgnored = 0;
  let unsupportedUrlsIgnored = 0;

  for (const candidate of candidates) {
    const validation = validateBatchUrl(candidate);
    if (!validation.ok) {
      if (validation.issue.reason === 'unsupported') {
        unsupportedUrlsIgnored += 1;
      } else if (validation.issue.value.trim()) {
        invalidUrlsIgnored += 1;
      }
      continue;
    }

    if (skipDuplicates && existingUrls.has(validation.url)) {
      duplicatesSkipped += 1;
      continue;
    }

    existingUrls.add(validation.url);
    addedUrls.push(validation.url);
  }

  if (addedUrls.length > 0) {
    urlsText.value = [urlsText.value.trim(), ...addedUrls].filter(Boolean).join('\n');
  }

  const summary = {
    importedUrls: addedUrls.length,
    duplicatesSkipped,
    invalidUrlsIgnored,
    unsupportedUrlsIgnored
  };
  importSummary.value = summary;
  return summary;
}

async function pasteUrls(): Promise<void> {
  try {
    const pastedText = await navigator.clipboard.readText();
    urlsText.value = [urlsText.value.trim(), pastedText.trim()].filter(Boolean).join('\n');
    importSummary.value = null;
  } catch {
    toastError(t('home.copyError'));
  }
}

function removeDuplicates(): void {
  const normalized = normalizeUrlInput(urlsText.value);
  const invalidValues = Array.from(new Set(normalized.invalidItems.map((item) => item.value)));
  urlsText.value = [...normalized.validUrls, ...invalidValues].join('\n');
  importSummary.value = null;
}

function clearUrls(): void {
  urlsText.value = '';
  importSummary.value = null;
}

async function loadOpenTabs(): Promise<void> {
  openTabsLoading.value = true;
  openTabsError.value = null;

  try {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
      throw new Error('Open tabs are only available when ExtractKit is loaded as a Chrome extension.');
    }

    const queryInfo: chrome.tabs.QueryInfo = { windowType: 'normal' };
    if (currentWindowOnly.value) {
      queryInfo.currentWindow = true;
    }

    const tabs = await queryBrowserTabs(queryInfo);
    const activeTabs = await queryBrowserTabs({ active: true, currentWindow: true, windowType: 'normal' });
    activeTabDomain.value = domainFromUrl(activeTabs[0]?.url);
    openTabs.value = tabs
      .filter((tab) => Boolean(tab.id && tab.url))
      .map((tab) => {
        const validation = validateBatchUrl(tab.url ?? '');
        const url = validation.ok ? validation.url : (tab.url ?? '');

        return {
          id: tab.id ?? 0,
          title: tab.title || url,
          url,
          domain: domainFromUrl(url),
          supported: validation.ok,
          selected: validation.ok,
          reason: validation.ok ? undefined : validation.issue.message
        };
      });
  } catch (caughtError) {
    openTabsError.value = caughtError instanceof Error ? caughtError.message : 'Could not read open tabs.';
  } finally {
    openTabsLoading.value = false;
  }
}

async function openTabsPicker(): Promise<void> {
  openTabsPanelOpen.value = true;
  await loadOpenTabs();
}

function closeOpenTabsPicker(): void {
  openTabsPanelOpen.value = false;
  openTabsError.value = null;
}

function selectAllSupportedTabs(): void {
  const visibleIds = new Set(visibleOpenTabs.value.filter((tab) => tab.supported).map((tab) => tab.id));
  openTabs.value = openTabs.value.map((tab) => (visibleIds.has(tab.id) ? { ...tab, selected: true } : tab));
}

function toggleOpenTab(tabId: number, selected: boolean): void {
  openTabs.value = openTabs.value.map((tab) => (tab.id === tabId ? { ...tab, selected } : tab));
}

function addSelectedOpenTabs(): void {
  appendUrlCandidates(visibleOpenTabs.value.filter((tab) => tab.supported && tab.selected).map((tab) => tab.url));
  closeOpenTabsPicker();
}

function discoveryStatusLabel(status: UrlDiscoveryStatus): string {
  if (status === 'discovered') {
    return t('batch.discovery.discovered');
  }

  if (status === 'duplicate') {
    return t('batch.discovery.duplicate');
  }

  if (status === 'external') {
    return t('batch.discovery.externalUrl');
  }

  if (status === 'unsupported') {
    return t('batch.discovery.unsupportedUrl');
  }

  return t('batch.discovery.invalidUrl');
}

function discoveryStatusVariant(status: UrlDiscoveryStatus): 'neutral' | 'success' | 'warning' | 'danger' | 'accent' {
  if (status === 'discovered') {
    return 'success';
  }

  if (status === 'duplicate' || status === 'external') {
    return 'warning';
  }

  if (status === 'invalid' || status === 'unsupported') {
    return 'danger';
  }

  return 'neutral';
}

function discoveryErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return t('batch.discovery.permissionError');
  }

  const message = error.message.toLowerCase();
  if (message.includes('receiving end does not exist') || message.includes('message port closed')) {
    return t('batch.discovery.contentUnavailable');
  }

  return error.message;
}

async function openDiscoverUrls(): Promise<void> {
  discoverPanelOpen.value = true;
  discoveryError.value = null;
  discoveryRan.value = false;
  discoverySearch.value = '';
  discoveryItems.value = [];
  discoveryCounts.value = null;
  await refreshDiscoverySource();
  discoverySourceUrl.value = discoveryCurrentTab.value?.url ?? '';
  discoverySourceTitle.value = discoveryCurrentTab.value?.title ?? '';
}

function closeDiscoverUrls(): void {
  discoverPanelOpen.value = false;
  discoveryError.value = null;
}

async function runUrlDiscovery(): Promise<void> {
  discoveryLoading.value = true;
  discoveryError.value = null;
  discoveryRan.value = false;
  discoveryItems.value = [];
  discoveryCounts.value = null;

  try {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      throw new Error(t('batch.discovery.permissionError'));
    }

    if (!discoverySourceDisplay.value) {
      throw new Error(t('batch.discovery.noActiveTab'));
    }

    if (!discoverySourceSupported.value) {
      throw new Error(t('batch.discovery.unsupportedUrl'));
    }

    const options: UrlDiscoveryOptions = {
      ...discoveryOptions.value,
      maxUrls: Math.min(1000, Math.max(1, Math.round(Number(discoveryOptions.value.maxUrls) || 100)))
    };
    discoveryOptions.value = options;

    const response = (await chrome.runtime.sendMessage({
      type: MESSAGE_DISCOVER_URLS,
      options
    })) as UrlDiscoveryResponse;

    if (!response.ok) {
      throw new Error(response.error);
    }

    discoverySourceUrl.value = response.data.sourceUrl;
    discoverySourceTitle.value = response.data.sourceTitle ?? discoverySourceTitle.value;
    discoveryCounts.value = response.data.counts;
    discoveryItems.value = response.data.items.map((item) => ({
      ...item,
      selected: item.status === 'discovered'
    }));
    discoveryRan.value = true;
  } catch (caughtError) {
    discoveryError.value = discoveryErrorMessage(caughtError);
  } finally {
    discoveryLoading.value = false;
  }
}

function toggleDiscoveredUrl(itemId: string, selected: boolean): void {
  discoveryItems.value = discoveryItems.value.map((item) =>
    item.id === itemId ? { ...item, selected: item.status === 'discovered' && selected } : item
  );
}

function selectAllDiscoveredUrls(): void {
  const visibleIds = new Set(
    visibleDiscoveryItems.value.filter((item) => item.status === 'discovered').map((item) => item.id)
  );
  discoveryItems.value = discoveryItems.value.map((item) =>
    visibleIds.has(item.id) ? { ...item, selected: true } : item
  );
}

function clearDiscoverySelection(): void {
  discoveryItems.value = discoveryItems.value.map((item) => ({ ...item, selected: false }));
}

function addSelectedDiscoveredUrls(): void {
  const urls = discoveryItems.value
    .filter((item) => item.status === 'discovered' && item.selected)
    .map((item) => item.url);

  if (urls.length === 0) {
    toastError(t('batch.discovery.noUrlsSelected'));
    return;
  }

  appendUrlCandidates(urls, { skipDuplicates: discoveryOptions.value.removeDuplicates });
  closeDiscoverUrls();
}

function triggerFileImport(): void {
  fileInput.value?.click();
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }
      row.push(cell.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      cell = '';
      continue;
    }

    cell += character;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

function extractUrlsFromCsv(text: string): string[] {
  const rows = parseCsvRows(text);
  const [header, ...bodyRows] = rows;
  if (!header) {
    return [];
  }

  const urlColumnIndex = header.findIndex((cell) => ['url', 'link', 'href'].includes(cell.trim().toLowerCase()));
  if (urlColumnIndex >= 0) {
    return bodyRows.map((row) => row[urlColumnIndex] ?? '').filter(Boolean);
  }

  const urlLikePattern = /https?:\/\/[^\s,"']+/gi;
  return rows.flatMap((row) => row.flatMap((cell) => cell.match(urlLikePattern) ?? []));
}

function extractUrlsFromFile(fileName: string, text: string): string[] {
  if (fileName.toLowerCase().endsWith('.csv')) {
    return extractUrlsFromCsv(text);
  }

  return text.split(/\r?\n/);
}

async function importUrlFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    appendUrlCandidates(extractUrlsFromFile(file.name, text));
  } catch (caughtError) {
    toastError(t('batch.importFile'), caughtError instanceof Error ? caughtError.message : 'Could not import URLs.');
  } finally {
    input.value = '';
  }
}

async function start(): Promise<void> {
  if (activeStoredBatch.value) {
    toastError(t('batch.alreadyActive'), t('batch.activeStartBlocked'));
    return;
  }

  const batch = await startBatchRun({
    name: previewBatchName.value,
    urls: urlInput.value.validUrls,
    recipes: selectedRecipes.value,
    options: options.value
  });

  if (!batch) {
    if (error.value) {
      toastError(t('batch.batchRun'), error.value);
    }
    return;
  }

  activeBatchId.value = batch.id;
  toastSuccess(t('batch.running'));
}

async function pause(): Promise<void> {
  if (!activeBatch.value) {
    return;
  }

  const batch = await pauseBatchRun(activeBatch.value.id);
  if (batch) {
    activeBatchId.value = batch.id;
    toastSuccess(t('batch.pauseRequested'));
  } else if (error.value) {
    toastError(t('batch.pause'), error.value);
  }
}

async function resume(): Promise<void> {
  if (!activeBatch.value) {
    return;
  }

  const batch = await resumeBatchRun(activeBatch.value.id);
  if (batch) {
    activeBatchId.value = batch.id;
    toastSuccess(t('batch.resumed'));
  } else if (error.value) {
    toastError(t('batch.resume'), error.value);
  }
}

async function stop(): Promise<void> {
  if (!activeBatch.value) {
    return;
  }

  const batch = await stopBatchRun(activeBatch.value.id);
  if (batch) {
    activeBatchId.value = batch.id;
    toastSuccess(t('batch.stopped'));
  }
}

async function exportBatch(): Promise<void> {
  if (!activeBatch.value) {
    return;
  }

  await loadRuns();
  await exportRuns(batchRunsForExport.value, props.recipes, `extractkit-${displayBatchName(activeBatch.value)}`, [
    activeBatch.value
  ]);
  if (exportError.value) {
    toastError(t('toast.exportFailed'), exportError.value);
  } else {
    toastSuccess(t('toast.exported'));
  }
}

function viewRuns(): void {
  router.push('/runs');
}

function startNewBatch(): void {
  activeBatchId.value = null;
  batchName.value = '';
  previewCreatedAt.value = new Date().toISOString();
}

function runStatusLabel(batch: BatchRun): string {
  return t(`batch.status.${batch.status}` as TranslationKey);
}
</script>

<template>
  <div class="space-y-3">
    <template v-if="activeBatch?.status === 'running' || activeBatch?.status === 'paused'">
      <div
        v-if="activeBatch.status === 'running'"
        class="rounded-md border border-amberline-100 bg-amberline-50 px-3 py-2 text-sm text-amberline-600 dark:border-amberline-500/30 dark:bg-amberline-500/15 dark:text-amberline-100"
      >
        <div class="flex items-start gap-2">
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" :stroke-width="2.1" aria-hidden="true" />
          <p><strong>{{ t('batch.keepTabOpen') }}</strong> {{ t('batch.browsingNote') }}</p>
        </div>
      </div>

      <div
        v-else
        class="rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:border-brand-500/35 dark:bg-brand-600/10 dark:text-brand-400"
      >
        <p v-if="activeBatch.pauseReason === 'processing-tab-closed'">
          <strong>{{ t('batch.processingTabClosed') }}</strong> {{ t('batch.pausedAvoidLoss') }}
        </p>
        <p v-else>{{ t('batch.resumeLater') }}</p>
      </div>

      <Card>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="field-label">{{ activeBatch.status === 'paused' ? t('batch.paused') : t('batch.running') }}</p>
            <h2 class="truncate text-lg font-semibold text-ink-900 dark:text-ink-50">{{ displayBatchName(activeBatch) }}</h2>
          </div>
          <Badge variant="primary" size="sm">{{ progressPercent }}%</Badge>
        </div>

        <div class="mt-4 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
          <div class="h-full rounded-full bg-brand-600 transition-all" :style="{ width: `${progressPercent}%` }" />
        </div>

        <div class="mt-4 grid grid-cols-4 gap-2 text-center">
          <div>
            <p class="field-label">{{ t('batch.plannedRuns') }}</p>
            <p class="text-sm font-semibold text-ink-900 dark:text-ink-50">{{ activeBatch.completedRuns }} / {{ activeBatch.totalPlannedRuns }}</p>
          </div>
          <div>
            <p class="field-label">{{ t('batch.successful') }}</p>
            <p class="text-sm font-semibold text-success-500">{{ activeBatch.successfulRuns }}</p>
          </div>
          <div>
            <p class="field-label">{{ t('batch.warningRuns') }}</p>
            <p class="text-sm font-semibold text-amberline-500">{{ activeBatch.warningRuns }}</p>
          </div>
          <div>
            <p class="field-label">{{ t('batch.failedRuns') }}</p>
            <p class="text-sm font-semibold text-coral-500">{{ activeBatch.failedRuns }}</p>
          </div>
        </div>

        <div class="mt-4 grid gap-2">
          <div>
            <p class="field-label">{{ t('batch.currentUrl') }}</p>
            <p class="meta-line mt-1 truncate rounded-md border border-ink-200 bg-ink-100 px-2.5 py-2 dark:border-ink-700 dark:bg-ink-800">
              {{ currentBatchUrl }}
            </p>
          </div>
          <div>
            <p class="field-label">{{ t('batch.currentRecipe') }}</p>
            <p class="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-50">{{ currentEvent?.recipeName ?? '—' }}</p>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <Button v-if="activeBatch.status === 'running'" size="xs" @click="viewProcessingTab(activeBatch.id)">
            <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('batch.viewProcessingTab') }}
          </Button>
          <Button v-if="activeBatch.status === 'running'" size="xs" :disabled="activeBatch.pauseRequested" @click="pause">
            <Pause class="h-3.5 w-3.5" aria-hidden="true" />
            {{ activeBatch.pauseRequested ? t('batch.pausingAfterCurrentItem') : t('batch.pause') }}
          </Button>
          <Button v-else size="xs" variant="primary" @click="resume">
            <Play class="h-3.5 w-3.5" aria-hidden="true" />
            {{ activeBatch.pauseReason === 'processing-tab-closed' ? t('batch.resumeInNewTab') : t('batch.resume') }}
          </Button>
          <Button size="xs" variant="danger" @click="stop">
            <Square class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('batch.stop') }}
          </Button>
        </div>
      </Card>

      <Card compact>
        <p class="field-label">{{ t('batch.recentEvents') }}</p>
        <ul class="mt-2 divide-y divide-ink-200 dark:divide-ink-700">
          <li v-for="event in recentEvents" :key="event.id" class="flex items-start gap-2 py-2">
            <Badge :variant="eventVariant(event)">{{ event.status }}</Badge>
            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                <p class="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ eventTitle(event) }}</p>
                <Badge v-if="event.httpStatus" variant="neutral">{{ t('batch.httpStatus') }} {{ event.httpStatus }}</Badge>
              </div>
              <p v-if="event.message && event.errorKind !== 'http-error' && event.message !== eventTitle(event)" class="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-300">
                {{ event.message }}
              </p>
              <p class="meta-line mt-0.5 truncate">{{ event.url }}</p>
            </div>
            <span v-if="eventDuration(event)" class="text-xs text-ink-500 dark:text-ink-300">{{ eventDuration(event) }}</span>
          </li>
        </ul>
      </Card>
    </template>

    <template v-else-if="activeBatch">
      <Card>
        <div class="text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-400">
            <CheckCircle2 v-if="activeBatch.status === 'completed'" class="h-7 w-7" :stroke-width="2.2" aria-hidden="true" />
            <AlertTriangle v-else class="h-7 w-7" :stroke-width="2.2" aria-hidden="true" />
          </div>
          <h2 class="mt-3 text-lg font-semibold text-ink-900 dark:text-ink-50">
            {{ activeBatch.status === 'completed' ? t('batch.complete') : activeBatch.status === 'cancelled' ? t('batch.cancelled') : runStatusLabel(activeBatch) }}
          </h2>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">{{ displayBatchName(activeBatch) }}</p>
          <Badge class="mt-3" :variant="batchVariant(activeBatch.status)">{{ runStatusLabel(activeBatch) }}</Badge>
        </div>

        <div v-if="hasProcessingTabClosed" class="mt-4 rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-medium text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
          {{ t('batch.processingTabClosed') }}
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <div class="rounded-md border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900">
            <p class="field-label">{{ t('batch.plannedRuns') }}</p>
            <p class="mt-1 text-lg font-semibold text-ink-900 dark:text-ink-50">{{ activeBatch.totalPlannedRuns }}</p>
          </div>
          <div class="rounded-md border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900">
            <p class="field-label">{{ t('batch.duration') }}</p>
            <p class="mt-1 text-lg font-semibold text-ink-900 dark:text-ink-50">{{ batchDuration(activeBatch) }}</p>
          </div>
          <div class="rounded-md border border-success-500/20 bg-success-50 p-3 dark:bg-success-500/15">
            <p class="field-label text-success-500">{{ t('batch.successful') }}</p>
            <p class="mt-1 text-lg font-semibold text-success-500">{{ activeBatch.successfulRuns }}</p>
          </div>
          <div class="rounded-md border border-amberline-100 bg-amberline-50 p-3 dark:border-amberline-500/30 dark:bg-amberline-500/15">
            <p class="field-label text-amberline-500">{{ t('batch.warningRuns') }}</p>
            <p class="mt-1 text-lg font-semibold text-amberline-500">{{ activeBatch.warningRuns }}</p>
          </div>
          <div class="rounded-md border border-coral-100 bg-coral-50 p-3 dark:border-coral-500/30 dark:bg-coral-500/10">
            <p class="field-label text-coral-500">{{ t('batch.failedRuns') }}</p>
            <p class="mt-1 text-lg font-semibold text-coral-500">{{ activeBatch.failedRuns }}</p>
          </div>
          <div class="rounded-md border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900">
            <p class="field-label">{{ t('batch.skippedRuns') }}</p>
            <p class="mt-1 text-lg font-semibold text-ink-900 dark:text-ink-50">{{ activeBatch.skippedRuns }}</p>
          </div>
        </div>

        <div class="mt-4 grid gap-2">
          <Button variant="primary" :disabled="exporting" @click="exportBatch">
            {{ t('batch.export') }}
          </Button>
          <div class="grid grid-cols-2 gap-2">
            <Button @click="startNewBatch">
              <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.startNew') }}
            </Button>
            <Button @click="viewRuns">{{ t('batch.viewRuns') }}</Button>
          </div>
        </div>
      </Card>
    </template>

    <template v-else>
      <template v-if="discoverPanelOpen">
        <Card>
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-2">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-400">
                <Compass class="h-5 w-5" :stroke-width="2.1" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <p class="field-label">{{ t('batch.discovery.discoverFromActiveTab') }}</p>
                <h2 class="text-base font-semibold text-ink-900 dark:text-ink-50">{{ t('batch.discovery.discoverUrls') }}</h2>
              </div>
            </div>
            <Button size="xs" variant="ghost" @click="closeDiscoverUrls">
              <ArrowLeft class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.batchRun') }}
            </Button>
          </div>

          <div class="mt-4 grid gap-2">
            <div>
              <p class="field-label">{{ t('batch.discovery.sourcePage') }}</p>
              <p class="mt-1 truncate rounded-md border border-ink-200 bg-ink-100 px-2.5 py-2 font-mono text-xs text-ink-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100">
                {{ discoverySourceDisplay || '—' }}
              </p>
              <p v-if="discoverySourceTitle" class="mt-1 truncate text-xs font-medium text-ink-500 dark:text-ink-300">
                {{ discoverySourceTitle }}
              </p>
            </div>

            <p v-if="discoverySourceError" class="rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-medium text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
              {{ discoverySourceError }}
            </p>
            <p v-else-if="discoverySourceDisplay && !discoverySourceSupported" class="rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-medium text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
              {{ t('batch.discovery.unsupportedUrl') }}
            </p>
            <p v-else-if="!discoverySourceDisplay && !discoverySourceLoading" class="rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-medium text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
              {{ t('batch.discovery.noActiveTab') }}
            </p>
          </div>
        </Card>

        <Card>
          <div class="grid gap-3">
            <div class="grid gap-2">
              <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
                <input v-model="discoveryOptions.sameDomainOnly" class="h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
                {{ t('batch.discovery.sameDomainOnly') }}
              </label>
              <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
                <input v-model="discoveryOptions.removeDuplicates" class="h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
                {{ t('batch.discovery.removeDuplicates') }}
              </label>
              <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
                <input v-model="discoveryOptions.removeFragments" class="h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
                {{ t('batch.discovery.removeFragments') }}
              </label>
            </div>

            <label class="grid gap-1">
              <span class="field-label">{{ t('batch.discovery.maxUrls') }}</span>
              <input v-model.number="discoveryOptions.maxUrls" class="input" min="1" max="1000" type="number" />
            </label>

            <Button
              variant="primary"
              :disabled="discoveryLoading || discoverySourceLoading || !discoverySourceSupported"
              @click="runUrlDiscovery"
            >
              <Search class="h-3.5 w-3.5" aria-hidden="true" />
              {{ discoveryLoading ? t('home.running') : t('batch.discovery.runDiscovery') }}
            </Button>

            <p v-if="discoveryError" class="rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
              {{ discoveryError }}
            </p>
          </div>
        </Card>

        <Card v-if="discoveryRan">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <Link2 class="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-400" :stroke-width="2.1" aria-hidden="true" />
              <div class="min-w-0">
                <p class="field-label">{{ t('batch.discovery.discoveredUrls') }}</p>
                <h2 class="truncate text-base font-semibold text-ink-900 dark:text-ink-50">
                  {{ discoveryCounts?.discovered ?? 0 }} {{ t('batch.discovery.discovered') }}
                </h2>
              </div>
            </div>
            <Badge variant="primary">{{ selectedDiscoveryCount }} {{ t('batch.discovery.selected') }}</Badge>
          </div>

          <div class="mb-3 flex flex-wrap gap-1.5">
            <Badge variant="success">{{ discoveryCounts?.discovered ?? 0 }} {{ t('batch.discovery.discovered') }}</Badge>
            <Badge variant="primary">{{ selectedDiscoveryCount }} {{ t('batch.discovery.selected') }}</Badge>
            <Badge variant="neutral">{{ discoveryCounts?.skipped ?? 0 }} {{ t('batch.discovery.skipped') }}</Badge>
            <Badge variant="neutral">{{ discoveryCounts?.duplicates ?? 0 }} {{ t('batch.discovery.duplicate') }}</Badge>
            <Badge variant="neutral">{{ discoveryCounts?.unsupported ?? 0 }} {{ t('batch.discovery.unsupportedUrl') }}</Badge>
            <Badge variant="neutral">{{ discoveryCounts?.externalExcluded ?? 0 }} {{ t('batch.discovery.externalUrl') }}</Badge>
            <Badge variant="neutral">{{ discoveryCounts?.invalid ?? 0 }} {{ t('batch.discovery.invalidUrl') }}</Badge>
          </div>

          <div class="mb-3 grid gap-2">
            <input v-model="discoverySearch" class="input" :placeholder="t('data.filterUrl')" />
            <div class="flex flex-wrap gap-2">
              <Button size="xs" @click="selectAllDiscoveredUrls">{{ t('batch.discovery.selectAll') }}</Button>
              <Button size="xs" variant="ghost" @click="clearDiscoverySelection">
                {{ t('batch.discovery.clearSelection') }}
              </Button>
            </div>
          </div>

          <EmptyState
            v-if="visibleDiscoveryItems.length === 0"
            compact
            :title="t('batch.discovery.noLinksFound')"
          />

          <div v-else class="max-h-80 space-y-2 overflow-y-auto pr-1">
            <label
              v-for="item in visibleDiscoveryItems"
              :key="item.id"
              class="flex items-start gap-2 rounded-md border border-ink-200 bg-white p-2 dark:border-ink-700 dark:bg-ink-950"
              :class="item.status === 'discovered' ? 'cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-900' : 'opacity-70'"
            >
              <input
                class="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600"
                type="checkbox"
                :checked="item.selected"
                :disabled="item.status !== 'discovered'"
                @change="toggleDiscoveredUrl(item.id, ($event.target as HTMLInputElement).checked)"
              />
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-1.5">
                  <p class="min-w-0 flex-1 truncate font-mono text-xs text-ink-900 dark:text-ink-50">{{ item.url }}</p>
                  <Badge :variant="discoveryStatusVariant(item.status)">{{ discoveryStatusLabel(item.status) }}</Badge>
                </div>
                <p v-if="item.text" class="mt-1 truncate text-xs text-ink-500 dark:text-ink-300">{{ item.text }}</p>
                <p v-if="item.status !== 'discovered' && item.rawHref" class="meta-line mt-0.5 truncate">{{ item.rawHref }}</p>
              </div>
            </label>
          </div>

          <div class="mt-3 grid gap-2">
            <Button variant="primary" :disabled="selectedDiscoveryCount === 0" @click="addSelectedDiscoveredUrls">
              {{ t('batch.discovery.addSelectedUrls') }}
            </Button>
            <Button variant="ghost" @click="closeDiscoverUrls">
              <ArrowLeft class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.batchRun') }}
            </Button>
          </div>
        </Card>
      </template>

      <template v-else>
      <Card>
        <label class="grid gap-1">
          <span class="field-label">{{ t('batch.name') }}</span>
          <input v-model="batchName" class="input" :placeholder="t('batch.namePlaceholder')" />
        </label>
      </Card>

      <Card>
        <div class="mb-2 flex items-center justify-between gap-2">
          <label class="field-label" for="batch-urls">{{ t('batch.urls') }}</label>
          <div class="flex flex-wrap justify-end gap-1">
            <Button size="xs" variant="ghost" @click="pasteUrls">
              <Clipboard class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.paste') }}
            </Button>
            <Button size="xs" variant="ghost" @click="openTabsPicker">
              <Plus class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.addOpenTabs') }}
            </Button>
            <Button size="xs" variant="ghost" @click="openDiscoverUrls">
              <Compass class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.discovery.discoverUrls') }}
            </Button>
            <Button size="xs" variant="ghost" @click="triggerFileImport">
              <FileUp class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.importFile') }}
            </Button>
            <input ref="fileInput" class="hidden" type="file" accept=".txt,.csv,text/plain,text/csv" @change="importUrlFile" />
          </div>
        </div>
        <textarea
          id="batch-urls"
          v-model="urlsText"
          class="input min-h-36 resize-y font-mono text-xs"
          :placeholder="t('batch.urlsPlaceholder')"
        />
        <div class="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="success">{{ urlInput.validUrls.length }} {{ t('batch.validUrls') }}</Badge>
          <Badge :variant="urlInput.invalidUrls.length > 0 ? 'danger' : 'neutral'">
            {{ urlInput.invalidUrls.length }} {{ t('batch.invalidUrls') }}
          </Badge>
          <Badge :variant="urlInput.unsupportedUrls.length > 0 ? 'warning' : 'neutral'">
            {{ urlInput.unsupportedUrls.length }} {{ t('batch.unsupportedUrls') }}
          </Badge>
          <Badge v-if="urlInput.duplicateCount > 0" variant="neutral">
            {{ urlInput.duplicateCount }} {{ t('batch.duplicatesRemoved') }}
          </Badge>
        </div>

        <div v-if="importSummary" class="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="success">{{ importSummary.importedUrls }} {{ t('batch.importedUrls') }}</Badge>
          <Badge variant="neutral">{{ importSummary.duplicatesSkipped }} {{ t('batch.duplicatesSkipped') }}</Badge>
          <Badge variant="neutral">{{ importSummary.invalidUrlsIgnored }} {{ t('batch.invalidUrlsIgnored') }}</Badge>
          <Badge variant="neutral">{{ importSummary.unsupportedUrlsIgnored }} {{ t('batch.unsupportedUrls') }}</Badge>
        </div>

        <ul v-if="urlInput.invalidItems.length > 0" class="mt-2 space-y-1 text-xs text-coral-500">
          <li v-for="item in urlInput.invalidItems.slice(0, 4)" :key="`${item.value}-${item.reason}`" class="truncate">
            <span class="font-mono">{{ item.value }}</span>
            <span class="text-ink-500 dark:text-ink-300"> — {{ item.message }}</span>
          </li>
        </ul>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button size="xs" @click="removeDuplicates">{{ t('batch.removeDuplicates') }}</Button>
          <Button size="xs" variant="ghost" @click="clearUrls">
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('batch.clear') }}
          </Button>
        </div>

        <div
          v-if="openTabsPanelOpen"
          class="mt-3 rounded-md border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="field-label">{{ t('batch.openTabs') }}</p>
              <h3 class="text-sm font-semibold text-ink-900 dark:text-ink-50">{{ t('batch.selectTabsToAdd') }}</h3>
            </div>
            <button
              type="button"
              class="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800"
              @click="closeOpenTabsPicker"
            >
              <X class="h-3.5 w-3.5" :stroke-width="2.1" aria-hidden="true" />
            </button>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-ink-700 dark:text-ink-100">
            <label class="inline-flex items-center gap-1.5">
              <input v-model="currentWindowOnly" class="h-3.5 w-3.5 rounded border-ink-300 text-brand-600" type="checkbox" @change="loadOpenTabs" />
              {{ t('batch.currentWindowOnly') }}
            </label>
            <label class="inline-flex items-center gap-1.5">
              <input
                v-model="sameDomainOnly"
                class="h-3.5 w-3.5 rounded border-ink-300 text-brand-600"
                type="checkbox"
                :disabled="!activeTabDomain"
              />
              {{ t('batch.sameDomainAsActiveTab') }}
            </label>
            <Button size="xs" variant="ghost" class="ml-auto" @click="selectAllSupportedTabs">
              {{ t('batch.selectAllSupported') }}
            </Button>
          </div>

          <p v-if="openTabsError" class="mt-3 rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-medium text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
            {{ openTabsError }}
          </p>
          <p v-else-if="openTabsLoading" class="mt-3 text-sm text-ink-500 dark:text-ink-300">{{ t('home.running') }}</p>

          <div v-else class="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            <label
              v-for="tab in visibleOpenTabs"
              :key="tab.id"
              class="flex items-start gap-2 rounded-md border border-ink-200 bg-white p-2 dark:border-ink-700 dark:bg-ink-950"
              :class="tab.supported ? 'cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-900' : 'opacity-65'"
            >
              <input
                class="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600"
                type="checkbox"
                :checked="tab.selected"
                :disabled="!tab.supported"
                @change="toggleOpenTab(tab.id, ($event.target as HTMLInputElement).checked)"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ tab.title }}</p>
                <p class="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-300">{{ tab.domain || tab.reason }}</p>
                <p class="meta-line mt-0.5 truncate">{{ tab.url }}</p>
              </div>
            </label>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <Button size="xs" variant="primary" :disabled="selectedOpenTabCount === 0" @click="addSelectedOpenTabs">
              {{ t('batch.addSelectedUrls') }}
            </Button>
            <Button size="xs" variant="ghost" @click="closeOpenTabsPicker">{{ t('batch.cancel') }}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div class="mb-3 flex items-start justify-between gap-2">
          <div>
            <p class="field-label">{{ t('batch.recipes') }}</p>
            <h2 class="text-sm font-semibold text-ink-900 dark:text-ink-50">
              {{ selectedRecipes.length }} {{ t('batch.selectedRecipes') }}
            </h2>
          </div>
          <Badge variant="neutral">{{ props.recipes.length }}</Badge>
        </div>

        <label class="mb-3 flex items-start gap-2 rounded-md border border-ink-200 bg-ink-50 p-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100">
          <input v-model="options.runOnlyCompatibleRecipes" class="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
          <span>{{ t('batch.runOnlyCompatible') }}</span>
        </label>

        <div class="max-h-72 space-y-2 overflow-y-auto pr-1">
          <label
            v-for="recipe in props.recipes"
            :key="recipe.id"
            class="flex cursor-pointer items-start gap-2 rounded-lg border border-ink-200 bg-white p-2 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-950 dark:hover:bg-ink-900"
          >
            <input
              class="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600"
              type="checkbox"
              :checked="selectedRecipeIds.includes(recipe.id)"
              @change="toggleRecipe(recipe.id, ($event.target as HTMLInputElement).checked)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 items-center gap-1.5">
                <p class="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ recipe.name }}</p>
                <Badge variant="neutral">v{{ recipe.version }}</Badge>
              </div>
              <div class="mt-1 flex flex-wrap gap-1">
                <Badge variant="category">{{ categoryLabel(recipe.category) }}</Badge>
                <Badge variant="neutral">{{ t(`recipe.source.${recipe.source}` as TranslationKey) }}</Badge>
                <Badge variant="neutral">{{ countRecipeFields(recipe) }} {{ t('recipes.fields') }}</Badge>
                <Badge variant="neutral">{{ recipe.checks?.length ?? 0 }} {{ t('checks.title') }}</Badge>
              </div>
              <p class="meta-line mt-1 truncate">{{ patternSummary(recipe) }}</p>
            </div>
          </label>
        </div>
      </Card>

      <Card compact>
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 text-left"
          @click="advancedOpen = !advancedOpen"
        >
          <span class="text-sm font-semibold text-ink-900 dark:text-ink-50">{{ t('batch.advancedOptions') }}</span>
          <Badge variant="neutral">{{ advancedOpen ? '−' : '+' }}</Badge>
        </button>

        <div v-if="advancedOpen" class="mt-3 grid gap-3">
          <div class="grid grid-cols-2 gap-2">
            <label class="grid gap-1">
              <span class="field-label">{{ t('batch.delayBetweenUrls') }}</span>
              <input v-model.number="delaySeconds" class="input" min="0" type="number" />
            </label>
            <label class="grid gap-1">
              <span class="field-label">{{ t('batch.pageLoadTimeout') }}</span>
              <input v-model.number="pageLoadTimeoutSeconds" class="input" min="1" type="number" />
            </label>
            <label class="grid gap-1">
              <span class="field-label">{{ t('batch.waitAfterLoad') }}</span>
              <input v-model.number="waitAfterLoadSeconds" class="input" min="0" type="number" />
            </label>
            <label class="grid gap-1">
              <span class="field-label">{{ t('batch.retryFailedUrls') }}</span>
              <input v-model.number="options.retryFailedUrls" class="input" min="0" type="number" />
            </label>
          </div>

          <label class="grid gap-1">
            <span class="field-label">{{ t('batch.whenUrlFails') }}</span>
            <select v-model="options.onUrlError" class="input">
              <option v-for="option in urlErrorOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>
          </label>
          <label class="grid gap-1">
            <span class="field-label">{{ t('batch.whenRecipeFails') }}</span>
            <select v-model="options.onRecipeError" class="input">
              <option v-for="option in recipeErrorOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>
          </label>

          <div class="grid gap-2">
            <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
              <input v-model="options.saveSuccessfulRuns" class="h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
              {{ t('batch.saveSuccessfulRuns') }}
            </label>
            <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
              <input v-model="options.saveWarningRuns" class="h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
              {{ t('batch.saveWarningRuns') }}
            </label>
            <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
              <input v-model="options.saveFailedRuns" class="h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
              {{ t('batch.saveFailedRuns') }}
            </label>
            <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
              <input checked class="h-4 w-4 rounded border-ink-300 text-brand-600" disabled type="checkbox" />
              {{ t('batch.processingTabMode') }}
            </label>
            <label class="flex items-start gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
              <input v-model="options.skipHttpErrorPages" class="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
              <span>
                {{ t('batch.skipHttpErrorPages') }}
                <span class="mt-0.5 block text-xs font-normal leading-relaxed text-ink-500 dark:text-ink-300">
                  {{ t('batch.skipHttpErrorPagesDescription') }}
                </span>
              </span>
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <div class="flex items-start gap-2">
          <ListChecks class="mt-0.5 h-4 w-4 text-brand-700" :stroke-width="2.1" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="field-label">{{ t('batch.plan') }}</p>
            <h2 class="text-base font-semibold text-ink-900 dark:text-ink-50">
              {{ plan.totalPlannedRuns }} {{ t('batch.plannedRuns') }}
            </h2>
            <p class="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-300">{{ previewBatchName }}</p>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2">
          <Badge variant="neutral">{{ urlInput.validUrls.length }} {{ t('batch.validUrls') }}</Badge>
          <Badge :variant="urlInput.invalidUrls.length > 0 ? 'danger' : 'neutral'">
            {{ urlInput.invalidUrls.length }} {{ t('batch.invalidUrls') }}
          </Badge>
          <Badge :variant="urlInput.unsupportedUrls.length > 0 ? 'warning' : 'neutral'">
            {{ urlInput.unsupportedUrls.length }} {{ t('batch.unsupportedUrls') }}
          </Badge>
          <Badge variant="neutral">{{ selectedRecipes.length }} {{ t('batch.recipes') }}</Badge>
          <Badge :variant="plan.totalPlannedRuns > 0 ? 'primary' : 'warning'">
            {{ plan.totalPlannedRuns }} {{ t('batch.plannedRuns') }}
          </Badge>
          <Badge variant="info">{{ plan.skippedByCompatibility }} {{ t('batch.skippedByCompatibility') }}</Badge>
          <Badge :variant="plan.urlsWithNoCompatibleRecipes.length > 0 ? 'warning' : 'neutral'">
            {{ plan.urlsWithNoCompatibleRecipes.length }} {{ t('batch.urlsWithNoCompatibleRecipes') }}
          </Badge>
          <Badge variant="neutral">{{ t('batch.estimatedDuration') }} ~{{ formatDuration(plan.estimatedDurationMs) }}</Badge>
        </div>

        <div v-if="plan.mappings.length > 0" class="mt-3 space-y-2">
          <div v-for="mapping in plan.mappings.slice(0, 3)" :key="mapping.url" class="rounded-md border border-ink-200 bg-ink-50 p-2 dark:border-ink-700 dark:bg-ink-900">
            <p class="meta-line truncate">{{ mapping.url }}</p>
            <ul v-if="mapping.recipes.length > 0" class="mt-1 space-y-0.5 text-xs text-ink-500 dark:text-ink-300">
              <li v-for="recipe in mapping.recipes.slice(0, 3)" :key="recipe.id" class="truncate">
                {{ recipe.name }}
              </li>
              <li v-if="mapping.recipes.length > 3" class="font-medium">+{{ mapping.recipes.length - 3 }}</li>
            </ul>
            <p v-else class="mt-1 text-xs font-medium text-amberline-500">{{ t('batch.noCompatibleRecipes') }}</p>
          </div>
        </div>

        <div
          v-if="plan.urlsWithNoCompatibleRecipes.length > 0"
          class="mt-3 rounded-md border border-amberline-100 bg-amberline-50 p-2 dark:border-amberline-500/30 dark:bg-amberline-500/10"
        >
          <p class="field-label text-amberline-500">{{ t('batch.urlsWithNoCompatibleRecipes') }}</p>
          <ul class="mt-1 space-y-1 text-xs text-amberline-600 dark:text-amberline-100">
            <li v-for="url in plan.urlsWithNoCompatibleRecipes.slice(0, 3)" :key="url" class="truncate font-mono">{{ url }}</li>
            <li v-if="plan.urlsWithNoCompatibleRecipes.length > 3" class="font-semibold">
              +{{ plan.urlsWithNoCompatibleRecipes.length - 3 }}
            </li>
          </ul>
        </div>

        <p class="mt-3 text-xs text-ink-500 dark:text-ink-300">{{ t('batch.browsingNote') }}</p>

        <p v-if="error" class="mt-3 rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
          {{ error }}
        </p>

        <div class="mt-3 grid gap-2">
          <p v-if="urlInput.validUrls.length === 0" class="text-xs font-medium text-coral-500">{{ t('batch.noValidUrls') }}</p>
          <p v-else-if="selectedRecipes.length === 0" class="text-xs font-medium text-coral-500">{{ t('batch.noRecipesSelected') }}</p>
          <p v-else-if="plan.totalPlannedRuns === 0" class="text-xs font-medium text-coral-500">{{ t('batch.noPlannedRuns') }}</p>
          <Button variant="primary" :disabled="!canStart" @click="start">
            <Play class="h-3.5 w-3.5" aria-hidden="true" />
            {{ running ? t('home.running') : t('batch.start') }}
          </Button>
        </div>
      </Card>
      </template>
    </template>
  </div>
</template>
