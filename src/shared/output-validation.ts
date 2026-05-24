import type { JsonSchema, OutputValidationIssue, OutputValidationResult } from './types';

function getType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function matchesType(value: unknown, type: string | string[]): boolean {
  const actual = getType(value);
  if (Array.isArray(type)) return type.includes(actual);
  return actual === type;
}

function validateValue(data: unknown, schema: JsonSchema, path: string, issues: OutputValidationIssue[]): void {
  if (schema.type !== undefined) {
    const type = schema.type as string | string[];
    if (!matchesType(data, type)) {
      const expected = Array.isArray(type) ? type.join('|') : type;
      issues.push({ path, message: `must be of type ${expected}`, keyword: 'type' });
      return;
    }
  }

  if (schema.enum !== undefined) {
    const allowed = schema.enum as unknown[];
    if (!allowed.includes(data)) {
      issues.push({ path, message: `must be one of: ${allowed.join(', ')}`, keyword: 'enum' });
    }
    return;
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;

    if (schema.required) {
      for (const key of schema.required as string[]) {
        if (!(key in obj)) {
          issues.push({
            path: path ? `${path}/${key}` : `/${key}`,
            message: 'must have required property',
            keyword: 'required'
          });
        }
      }
    }

    if (schema.properties) {
      const props = schema.properties as Record<string, JsonSchema>;
      for (const [key, subSchema] of Object.entries(props)) {
        if (key in obj) {
          validateValue(obj[key], subSchema, path ? `${path}/${key}` : `/${key}`, issues);
        }
      }
    }
  }

  if (Array.isArray(data) && schema.items) {
    const itemSchema = schema.items as JsonSchema;
    for (let i = 0; i < data.length; i++) {
      validateValue(data[i], itemSchema, `${path}/${i}`, issues);
    }
  }
}

export function validateOutput(data: unknown, schema: JsonSchema | undefined): OutputValidationResult {
  if (!schema) {
    return {
      status: 'skipped',
      issues: []
    };
  }

  const issues: OutputValidationIssue[] = [];
  validateValue(data, schema, '', issues);

  if (issues.length === 0) {
    return { status: 'valid', issues: [] };
  }

  return { status: 'invalid', issues };
}
