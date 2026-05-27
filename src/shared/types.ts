export type ExtractMode = 'text' | 'html' | 'attribute' | 'json' | 'exists' | 'count' | 'tagName';

export type Transform =
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'number'
  | 'currency'
  | 'absoluteUrl'
  | 'removeExtraSpaces'
  | 'jsonParse';

export type BaseField = {
  id: string;
  key: string;
  selector: string;
  required?: boolean;
};

export type SimpleField = BaseField & {
  kind: 'field';
  extract: ExtractMode;
  attribute?: string;
  multiple?: boolean;
  transforms?: Transform[];
};

export type GroupField = BaseField & {
  kind: 'group';
  multiple: true;
  fields: SimpleField[];
};

export type RecipeField = SimpleField | GroupField;

export type RecipeCategory =
  | 'seo'
  | 'metadata'
  | 'structured-data'
  | 'content'
  | 'ecommerce'
  | 'links'
  | 'images'
  | 'social'
  | 'qa'
  | 'custom';

export type RecipeSource = 'default' | 'user' | 'imported' | 'gallery';

export type CheckSeverity = 'info' | 'warning' | 'error';

export type CheckStatus = 'passed' | 'failed' | 'skipped';

export type RecipeCheckAssertion =
  | {
      type: 'exists';
    }
  | {
      type: 'notExists';
    }
  | {
      type: 'countEquals';
      value: number;
    }
  | {
      type: 'countGreaterThan';
      value: number;
    }
  | {
      type: 'countGreaterThanOrEqual';
      value: number;
    }
  | {
      type: 'countLessThan';
      value: number;
    }
  | {
      type: 'countLessThanOrEqual';
      value: number;
    }
  | {
      type: 'missingAttributeCountEquals';
      attribute: string;
      value: number;
    }
  | {
      type: 'emptyAttributeCountEquals';
      attribute: string;
      value: number;
    }
  | {
      type: 'eachElementMustHave';
      selector: string;
    }
  | {
      type: 'eachElementShouldHave';
      selector: string;
    };

export type RecipeCheck = {
  id: string;
  name: string;
  description?: string;
  selector: string;
  assertion: RecipeCheckAssertion;
  severity: CheckSeverity;
};

export type RecipeCheckResult = {
  id: string;
  name: string;
  description?: string;
  status: CheckStatus;
  severity: CheckSeverity;
  selector: string;
  assertion: RecipeCheckAssertion;
  actual?: unknown;
  expected?: string;
  message?: string;
};

export type RecipeChecksStatus = 'passed' | 'warning' | 'error' | 'skipped';

export type RecipeChecksResult = {
  status: RecipeChecksStatus;
  passed: number;
  warnings: number;
  errors: number;
  skipped: number;
  results: RecipeCheckResult[];
};

export type BatchRunStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';

export type BatchRunEventStatus = 'pending' | 'running' | 'success' | 'warning' | 'failed' | 'skipped';

export type BatchRunOptions = {
  runOnlyCompatibleRecipes: boolean;
  skipHttpErrorPages: boolean;
  skipHttpStatusCodes?: number[];
  delayBetweenUrlsMs: number;
  pageLoadTimeoutMs: number;
  waitAfterLoadMs: number;
  retryFailedUrls: number;
  onUrlError: 'stop' | 'skip' | 'retryThenSkip';
  onRecipeError: 'stop' | 'skipRecipe' | 'continue';
  saveSuccessfulRuns: boolean;
  saveWarningRuns: boolean;
  saveFailedRuns: boolean;
  processingTabMode: 'dedicatedPinnedTab';
};

export type BatchRunEvent = {
  id: string;
  batchId: string;
  url: string;
  recipeId?: string;
  recipeName?: string;
  status: BatchRunEventStatus;
  httpStatus?: number;
  errorKind?:
    | 'invalid-url'
    | 'unsupported-url'
    | 'http-error'
    | 'timeout'
    | 'navigation-error'
    | 'injection-error'
    | 'recipe-error'
    | 'no-compatible-recipes'
    | 'processing-tab-closed';
  message?: string;
  startedAt?: string;
  completedAt?: string;
  runId?: string;
};

export type BatchRun = {
  id: string;
  name: string;
  status: BatchRunStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  pauseReason?: 'user' | 'processing-tab-closed' | 'browser-restarted' | 'error';
  pausedAt?: string;
  resumedAt?: string;
  stopRequested?: boolean;
  pauseRequested?: boolean;
  currentUrlIndex?: number;
  currentRecipeIndex?: number;
  processingTabId?: number;
  urls: string[];
  recipeIds: string[];
  options: BatchRunOptions;
  totalPlannedRuns: number;
  completedRuns: number;
  successfulRuns: number;
  warningRuns: number;
  failedRuns: number;
  skippedRuns: number;
  events: BatchRunEvent[];
};

export type Recipe = {
  id: string;
  name: string;
  description?: string;
  category: RecipeCategory;
  tags: string[];
  source: RecipeSource;
  outputSchema?: JsonSchema;
  urlPatterns: string[];
  version: string;
  createdAt: string;
  updatedAt: string;
  fields: RecipeField[];
  checks?: RecipeCheck[];
};

export type FieldWarning = {
  field: string;
  message: string;
};

export type FieldError = {
  field?: string;
  message: string;
};

export type RecipeRun = {
  id: string;
  recipeId: string;
  recipeVersion: string;
  recipeName: string;
  batchId?: string;
  batchName?: string;
  batchUrlIndex?: number;
  url: string;
  domain: string;
  pageTitle?: string;
  status: 'success' | 'partial' | 'error';
  createdAt: string;
  durationMs: number;
  data: unknown;
  validation?: OutputValidationResult;
  checks?: RecipeChecksResult;
  warnings: FieldWarning[];
  errors: FieldError[];
  environment?: RunEnvironment;
};

export type ScrapeResult = {
  url: string;
  domain: string;
  pageTitle?: string;
  status: RecipeRun['status'];
  durationMs: number;
  data: Record<string, unknown>;
  checks?: RecipeChecksResult;
  warnings: FieldWarning[];
  errors: FieldError[];
  viewport?: { width: number; height: number };
};

export type CurrentTabInfo = {
  id: number;
  url?: string;
  title?: string;
};

export type UrlDiscoveryOptions = {
  sameDomainOnly: boolean;
  removeDuplicates: boolean;
  removeFragments: boolean;
  normalizeTrailingSlash: boolean;
  includePattern?: string;
  excludePattern?: string;
  maxUrls: number;
};

export type RawDiscoveredLink = {
  index: number;
  href: string;
  absoluteUrl: string;
  text?: string;
};

export type UrlDiscoveryStatus = 'discovered' | 'duplicate' | 'unsupported' | 'external' | 'invalid' | 'excluded';

export type UrlDiscoveryItem = {
  id: string;
  url: string;
  text?: string;
  status: UrlDiscoveryStatus;
  rawHref?: string;
  reason?: string;
  pattern?: string;
};

export type UrlDiscoveryCounts = {
  discovered: number;
  duplicates: number;
  unsupported: number;
  externalExcluded: number;
  patternExcluded: number;
  invalid: number;
  skipped: number;
};

export type UrlDiscoveryResult = {
  sourceUrl: string;
  sourceTitle?: string;
  items: UrlDiscoveryItem[];
  counts: UrlDiscoveryCounts;
};

export type RecipesById = Record<string, Recipe>;
export type RunsById = Record<string, RecipeRun>;
export type BatchRunsById = Record<string, BatchRun>;

export type JsonSchema = Record<string, unknown>;

export type OutputValidationStatus = 'valid' | 'invalid' | 'skipped';

export type OutputValidationIssue = {
  path: string;
  message: string;
  keyword?: string;
};

export type OutputValidationResult = {
  status: OutputValidationStatus;
  issues: OutputValidationIssue[];
};

export type ThemePreference = 'system' | 'light' | 'dark';
export type LocalePreference = 'en-US' | 'pt-BR';

export type ProcessingViewportPreset =
  | 'current-window'
  | 'desktop-1366x768'
  | 'desktop-1440x900'
  | 'desktop-1920x1080'
  | 'tablet-768x1024'
  | 'mobile-390x844'
  | 'custom';

export type ProcessingViewportSettings = {
  preset: ProcessingViewportPreset;
  customWidth?: number;
  customHeight?: number;
};

export type RunEnvironmentViewport = {
  width?: number;
  height?: number;
  source: 'current-window' | 'preset' | 'custom';
  label?: string;
};

export type RunEnvironment = {
  viewport?: RunEnvironmentViewport;
};

export type ResolvedProcessingViewport = {
  width?: number;
  height?: number;
  source: 'current-window' | 'preset' | 'custom';
  label: string;
};

export type UserPreferences = {
  theme: ThemePreference;
  locale: LocalePreference;
  processingViewport?: ProcessingViewportSettings;
  batchDefaults?: {
    skipHttpErrorPages: boolean;
  };
  exportOptions?: {
    includeRecipes: boolean;
    includeCsv: boolean;
    includeManifest: boolean;
  };
};

export type OnboardingState = {
  completed: boolean;
  completedAt?: string;
  skipped?: boolean;
  selectedStarterRecipeIds: string[];
};
