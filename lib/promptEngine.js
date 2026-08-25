const fs = require('fs');
const path = require('path');
const { getByPath } = require('./contextBuilder');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Loads all available template JSON files.
 * @returns {Array<{ id: string, type: string, title: string, description: string, stepCount: number, steps: Array<any> }>}
 */
function loadTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    return [];
  }
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
  // Prioritize web-app as the primary template
  files.sort((a, b) => {
    if (a === 'web-app.json') return -1;
    if (b === 'web-app.json') return 1;
    return a.localeCompare(b);
  });
  const templates = [];

  for (const file of files) {
    try {
      const fullPath = path.join(TEMPLATES_DIR, file);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(raw);
      const id = path.basename(file, '.json');
      templates.push({
        id,
        type: data.type || id,
        title: data.title || id,
        description: data.description || '',
        stepCount: Array.isArray(data.steps) ? data.steps.length : 0,
        steps: data.steps || []
      });
    } catch {
      // Ignore malformed templates
    }
  }

  return templates;
}

/**
 * Gets a specific template by id or type.
 * @param {string} templateId
 * @returns {object|null}
 */
function getTemplate(templateId) {
  const templates = loadTemplates();
  return templates.find(t => t.id === templateId || t.type === templateId) || null;
}

/**
 * Resolves prompt placeholders and checks `requires` dependencies against context.
 * 
 * @param {object} step The step definition from the template
 * @param {object} context The context loaded from context.json
 * @returns {{ resolvedPrompt: string, warnings: string[], missingKeys: string[] }}
 */
function resolveStepPrompt(step, context = {}) {
  const warnings = [];
  const missingKeys = [];
  const requires = Array.isArray(step.requires) ? step.requires : [];

  // Check required keys
  for (const reqKey of requires) {
    const val = getByPath(context, reqKey);
    if (val === undefined || val === null || val === '') {
      missingKeys.push(reqKey);
      warnings.push(`Missing prerequisite decision: "${reqKey}" is not recorded in context.json`);
    }
  }

  // Regex to match {{key.path}} or {{ key.path }}
  const placeholderRegex = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
  let resolvedPrompt = step.prompt || '';

  resolvedPrompt = resolvedPrompt.replace(placeholderRegex, (match, keyPath) => {
    const value = getByPath(context, keyPath);
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    }

    if (!missingKeys.includes(keyPath)) {
      missingKeys.push(keyPath);
      warnings.push(`Unresolved placeholder: "${keyPath}" has no value in context.json`);
    }
    return `[MISSING: ${keyPath}]`;
  });

  return {
    resolvedPrompt: resolvedPrompt.trim(),
    warnings,
    missingKeys
  };
}

module.exports = {
  loadTemplates,
  getTemplate,
  resolveStepPrompt
};

