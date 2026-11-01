/**
 * OpenAgriMap - Minimal JSON Schema (draft 2020-12 subset) validator.
 * Zero dependency. Supports the keywords used by schema/observation.schema.json:
 * type, required, properties, additionalProperties, enum, minimum, maximum,
 * minLength, maxLength, format: date-time.
 */
"use strict";

const fs = require("fs");
const path = require("path");

function loadSchema(schemaPath) {
  const file = schemaPath || path.join(__dirname, "..", "schema", "observation.schema.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function typeMatches(value, type) {
  switch (type) {
    case "object": return isObject(value);
    case "array": return Array.isArray(value);
    case "string": return typeof value === "string";
    case "number": return typeof value === "number" && !Number.isNaN(value);
    case "integer": return typeof value === "number" && Number.isInteger(value);
    case "boolean": return typeof value === "boolean";
    case "null": return value === null;
    default: return true;
  }
}

function isValidDateTime(value) {
  if (typeof value !== "string") return false;
  const t = Date.parse(value);
  return !Number.isNaN(t) && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
}

/**
 * Validate `data` against `schema`. Returns an array of error strings
 * (empty when valid). Paths use dot notation, e.g. "location.lat".
 */
function validate(data, schema, path = "") {
  const at = (msg) => (path ? `${path}: ${msg}` : `$: ${msg}`);
  const errors = [];

  if (schema.type && !typeMatches(data, schema.type)) {
    errors.push(at(`expected type ${schema.type}`));
    return errors;
  }

  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(at(`must be one of ${schema.enum.join(", ")}`));
  }

  if (typeof data === "number") {
    if (schema.minimum !== undefined && data < schema.minimum) errors.push(at(`must be >= ${schema.minimum}`));
    if (schema.maximum !== undefined && data > schema.maximum) errors.push(at(`must be <= ${schema.maximum}`));
  }

  if (typeof data === "string") {
    if (schema.minLength !== undefined && data.length < schema.minLength) errors.push(at(`must be at least ${schema.minLength} characters`));
    if (schema.maxLength !== undefined && data.length > schema.maxLength) errors.push(at(`must be at most ${schema.maxLength} characters`));
    if (schema.format === "date-time" && !isValidDateTime(data)) errors.push(at(`must be a valid ISO 8601 date-time`));
  }

  if (isObject(data)) {
    const props = schema.properties || {};
    for (const req of schema.required || []) {
      if (!(req in data)) errors.push(at(`missing required property "${req}"`));
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!(key in props)) errors.push(at(`additional property "${key}" is not allowed`));
      }
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in data) {
        errors.push(...validate(data[key], sub, path ? `${path}.${key}` : key));
      }
    }
  }

  return errors;
}

/** Validate an observation payload against the bundled observation schema. */
function validateObservation(payload, schema) {
  return validate(payload, schema || loadSchema());
}

module.exports = { loadSchema, validate, validateObservation };
