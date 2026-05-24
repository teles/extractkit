import type { GroupField, JsonSchema, Recipe, SimpleField } from './types';

function jsonValueSchema(): JsonSchema {
  return {
    type: ['object', 'array', 'string', 'number', 'boolean', 'null']
  };
}

function simpleValueSchema(field: SimpleField): JsonSchema {
  if (field.extract === 'exists') {
    return { type: 'boolean' };
  }

  if (field.extract === 'count') {
    return { type: 'number' };
  }

  if (field.extract === 'json') {
    return jsonValueSchema();
  }

  return { type: ['string', 'null'] };
}

function simpleFieldSchema(field: SimpleField): JsonSchema {
  const valueSchema = simpleValueSchema(field);
  if (field.multiple) {
    return {
      type: 'array',
      items: valueSchema
    };
  }

  return valueSchema;
}

function groupIssuesSchema(): JsonSchema {
  return {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        label: { type: 'string' },
        severity: { enum: ['info', 'warning', 'error'] }
      }
    }
  };
}

function groupFieldSchema(field: GroupField): JsonSchema {
  const properties: Record<string, JsonSchema> = {
    _issues: groupIssuesSchema()
  };
  const required: string[] = [];

  for (const childField of field.fields) {
    properties[childField.key] = simpleFieldSchema(childField);
    if (childField.required) {
      required.push(childField.key);
    }
  }

  return {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: true,
      properties,
      required
    }
  };
}

export function generateOutputSchema(recipe: Recipe): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const field of recipe.fields) {
    properties[field.key] = field.kind === 'group' ? groupFieldSchema(field) : simpleFieldSchema(field);
    if (field.required) {
      required.push(field.key);
    }
  }

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: true,
    properties,
    required
  };
}
