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
};

export type CurrentTabInfo = {
  id: number;
  url?: string;
  title?: string;
};

export type RecipesById = Record<string, Recipe>;
export type RunsById = Record<string, RecipeRun>;

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

export type UserPreferences = {
  theme: ThemePreference;
  locale: LocalePreference;
  exportOptions?: {
    includeRecipes: boolean;
    includeCsv: boolean;
    includeManifest: boolean;
  };
};
