// JSON Resume schema validator
import { Validator } from 'jsonschema';

// Enhanced JSON Resume schema validation with skip flag support
export function validateResume(data) {
  // Allow bypass via meta.skipValidation for experimental fields
  if (data?.meta?.skipValidation === true) {
    return { valid: true, errors: [] };
  }

  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Resume data is required'] };
  }

  // Basic structure validation (minimal guardrails if full schema isn't available)
  if (!data.basics) {
    errors.push('basics section is required');
  } else {
    if (!data.basics.name) {
      errors.push('basics.name is required');
    }
    if (!data.basics.email) {
      errors.push('basics.email is required');
    }
  }

  if (data.work && !Array.isArray(data.work)) {
    errors.push('work must be an array');
  }

  if (data.education && !Array.isArray(data.education)) {
    errors.push('education must be an array');
  }

  // Attempt full schema validation if resume-schema package is available
  try {
    // Some distributions export as default, some as named property
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const schemaModule = require('resume-schema');
    const schema = schemaModule?.default || schemaModule?.schema || schemaModule;
    if (schema) {
      const validator = new Validator();
      const result = validator.validate(data, schema);
      if (!result.valid) {
        return {
          valid: false,
          errors: result.errors?.map((e) => e.stack) || ['Schema validation failed'],
        };
      }
      return { valid: true, errors: [] };
    }
  } catch {
    // resume-schema might not be resolvable in some environments; fall back to basic checks
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

