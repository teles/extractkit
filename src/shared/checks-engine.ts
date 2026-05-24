import type { CheckStatus, RecipeCheck, RecipeCheckAssertion, RecipeCheckResult, RecipeChecksResult } from './types';

type CheckScope = Document | Element;

type ElementCoverage = {
  total: number;
  passed: number;
  failed: number;
};

const emptyChecksResult: RecipeChecksResult = {
  status: 'skipped',
  passed: 0,
  warnings: 0,
  errors: 0,
  skipped: 0,
  results: []
};

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown selector error';
}

function isSelfSelector(selector: string): boolean {
  return selector.trim() === ':scope';
}

function queryMany(scope: CheckScope, selector: string): Element[] {
  if (scope instanceof Element && isSelfSelector(selector)) {
    return [scope];
  }

  return Array.from(scope.querySelectorAll(selector));
}

function expectedText(assertion: RecipeCheckAssertion): string {
  if (assertion.type === 'exists') {
    return 'exists';
  }

  if (assertion.type === 'notExists') {
    return 'does not exist';
  }

  if (assertion.type === 'countEquals') {
    return `equals ${assertion.value}`;
  }

  if (assertion.type === 'countGreaterThan') {
    return `> ${assertion.value}`;
  }

  if (assertion.type === 'countGreaterThanOrEqual') {
    return `>= ${assertion.value}`;
  }

  if (assertion.type === 'countLessThan') {
    return `< ${assertion.value}`;
  }

  if (assertion.type === 'countLessThanOrEqual') {
    return `<= ${assertion.value}`;
  }

  if (assertion.type === 'missingAttributeCountEquals') {
    return `missing ${assertion.attribute} equals ${assertion.value}`;
  }

  if (assertion.type === 'emptyAttributeCountEquals') {
    return `empty ${assertion.attribute} equals ${assertion.value}`;
  }

  if (assertion.type === 'eachElementMustHave') {
    return `each element contains ${assertion.selector}`;
  }

  return `each element should contain ${assertion.selector}`;
}

function createResult(check: RecipeCheck, status: CheckStatus, actual?: unknown, message?: string): RecipeCheckResult {
  return {
    id: check.id,
    name: check.name,
    description: check.description,
    status,
    severity: check.severity,
    selector: check.selector,
    assertion: check.assertion,
    expected: expectedText(check.assertion),
    actual,
    message
  };
}

function statusFromBoolean(passed: boolean): CheckStatus {
  return passed ? 'passed' : 'failed';
}

function compareCount(count: number, assertion: RecipeCheckAssertion): boolean {
  if (assertion.type === 'countEquals') {
    return count === assertion.value;
  }

  if (assertion.type === 'countGreaterThan') {
    return count > assertion.value;
  }

  if (assertion.type === 'countGreaterThanOrEqual') {
    return count >= assertion.value;
  }

  if (assertion.type === 'countLessThan') {
    return count < assertion.value;
  }

  if (assertion.type === 'countLessThanOrEqual') {
    return count <= assertion.value;
  }

  return false;
}

function elementCoverage(elements: Element[], selector: string): ElementCoverage {
  let passed = 0;

  for (const element of elements) {
    if (element.querySelector(selector)) {
      passed += 1;
    }
  }

  return {
    total: elements.length,
    passed,
    failed: elements.length - passed
  };
}

function failureMessage(result: RecipeCheckResult): string | undefined {
  if (result.status !== 'failed') {
    return result.message;
  }

  if (typeof result.actual === 'number') {
    return `Expected ${result.expected}, found ${result.actual}.`;
  }

  if (result.actual && typeof result.actual === 'object') {
    const actual = result.actual as Partial<ElementCoverage>;
    if (typeof actual.total === 'number' && typeof actual.passed === 'number' && typeof actual.failed === 'number') {
      return `Expected ${result.expected}; ${actual.failed} of ${actual.total} did not match.`;
    }
  }

  return result.message ?? `Expected ${result.expected}.`;
}

function runSingleCheck(check: RecipeCheck, root: CheckScope): RecipeCheckResult {
  let elements: Element[];

  try {
    elements = queryMany(root, check.selector);
  } catch (error) {
    return createResult(check, 'failed', undefined, `Invalid selector "${check.selector}": ${messageFromError(error)}`);
  }

  const assertion = check.assertion;

  if (assertion.type === 'exists') {
    return createResult(check, statusFromBoolean(elements.length > 0), elements.length);
  }

  if (assertion.type === 'notExists') {
    return createResult(check, statusFromBoolean(elements.length === 0), elements.length);
  }

  if (assertion.type.startsWith('count')) {
    return createResult(check, statusFromBoolean(compareCount(elements.length, assertion)), elements.length);
  }

  if (assertion.type === 'missingAttributeCountEquals') {
    const missingCount = elements.filter((element) => !element.hasAttribute(assertion.attribute)).length;
    return createResult(check, statusFromBoolean(missingCount === assertion.value), missingCount);
  }

  if (assertion.type === 'emptyAttributeCountEquals') {
    const emptyCount = elements.filter(
      (element) =>
        element.hasAttribute(assertion.attribute) && (element.getAttribute(assertion.attribute) ?? '').trim() === ''
    ).length;
    return createResult(check, statusFromBoolean(emptyCount === assertion.value), emptyCount);
  }

  if (assertion.type === 'eachElementMustHave') {
    let actual: ElementCoverage;
    try {
      actual = elementCoverage(elements, assertion.selector);
    } catch (error) {
      return createResult(
        check,
        'failed',
        undefined,
        `Invalid inner selector "${assertion.selector}": ${messageFromError(error)}`
      );
    }

    return createResult(check, statusFromBoolean(actual.total > 0 && actual.failed === 0), actual);
  }

  if (assertion.type === 'eachElementShouldHave') {
    let actual: ElementCoverage;
    try {
      actual = elementCoverage(elements, assertion.selector);
    } catch (error) {
      return createResult(
        check,
        'failed',
        undefined,
        `Invalid inner selector "${assertion.selector}": ${messageFromError(error)}`
      );
    }

    return createResult(check, actual.total === 0 ? 'skipped' : statusFromBoolean(actual.failed === 0), actual);
  }

  return createResult(check, 'skipped', undefined, 'Unsupported check assertion.');
}

function aggregateResults(results: RecipeCheckResult[]): RecipeChecksResult {
  if (results.length === 0) {
    return emptyChecksResult;
  }

  const passed = results.filter((result) => result.status === 'passed').length;
  const warnings = results.filter((result) => result.status === 'failed' && result.severity === 'warning').length;
  const errors = results.filter((result) => result.status === 'failed' && result.severity === 'error').length;
  const skipped = results.filter((result) => result.status === 'skipped').length;

  return {
    status: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'passed',
    passed,
    warnings,
    errors,
    skipped,
    results: results.map((result) => ({
      ...result,
      message: failureMessage(result)
    }))
  };
}

export function runRecipeChecks(checks: RecipeCheck[] | undefined, root: CheckScope): RecipeChecksResult {
  if (!checks || checks.length === 0) {
    return emptyChecksResult;
  }

  return aggregateResults(
    checks.map((check) => {
      try {
        return runSingleCheck(check, root);
      } catch (error) {
        return createResult(check, 'failed', undefined, `Could not run check: ${messageFromError(error)}`);
      }
    })
  );
}
