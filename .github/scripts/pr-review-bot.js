const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync, spawnSync } = require('child_process');
const https = require('https');

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
const BOT_SIGNATURE = '<!-- build-with-ai-pr-bot -->';

/**
 * Safely extracts file content from a git ref or local disk without modifying working tree.
 * @param {string} filePath
 * @param {string} [headRef=process.env.HEAD_REF]
 * @param {string} [cwd=process.cwd()]
 * @returns {string|null}
 */
function getFileContent(filePath, headRef = process.env.HEAD_REF, cwd = process.cwd()) {
  if (headRef) {
    try {
      return execSync(`git show ${headRef}:${filePath}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch {
      // file might not exist in that ref
    }
  }
  const fullPath = path.join(cwd, filePath);
  if (fs.existsSync(fullPath)) {
    try {
      return fs.readFileSync(fullPath, 'utf8');
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Gets changed files and diff relative to base branch.
 * @param {string} [base='origin/main']
 * @returns {{ files: string[], diff: string }}
 */
function getGitChanges(base = 'origin/main') {
  const baseRef = process.env.BASE_REF || base;
  const headRef = process.env.HEAD_REF || 'HEAD';

  try {
    const diff = execSync(`git diff ${baseRef}...${headRef}`, { encoding: 'utf8' });
    const nameStatus = execSync(`git diff --name-status ${baseRef}...${headRef}`, { encoding: 'utf8' });
    const files = nameStatus
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => l.split(/\s+/).pop());
    return { files, diff };
  } catch {
    try {
      const diff = execSync(`git diff ${base}...HEAD`, { encoding: 'utf8' });
      const nameStatus = execSync(`git diff --name-status ${base}...HEAD`, { encoding: 'utf8' });
      const files = nameStatus
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => l.split(/\s+/).pop());
      return { files, diff };
    } catch {
      try {
        const diff = execSync('git diff HEAD~1...HEAD', { encoding: 'utf8' });
        const nameStatus = execSync('git diff --name-status HEAD~1...HEAD', { encoding: 'utf8' });
        const files = nameStatus
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .map(l => l.split(/\s+/).pop());
        return { files, diff };
      } catch {
        return { files: [], diff: '' };
      }
    }
  }
}

/**
 * Executes automated test suites.
 * @param {string} [cwd=process.cwd()]
 * @returns {{ passed: boolean, output: string, error?: string }}
 */
function runTestSuites(cwd = process.cwd()) {
  try {
    const res = spawnSync('npm', ['test'], {
      cwd,
      encoding: 'utf8',
      shell: true,
      timeout: 60000
    });
    const e2eRes = spawnSync('npm', ['run', 'test:e2e'], {
      cwd,
      encoding: 'utf8',
      shell: true,
      timeout: 60000
    });

    const passed = res.status === 0 && e2eRes.status === 0;
    const output = `${res.stdout || ''}\n${res.stderr || ''}\n${e2eRes.stdout || ''}\n${e2eRes.stderr || ''}`;
    return {
      passed,
      output: output.trim(),
      error: !passed ? (res.stderr || e2eRes.stderr || 'Test suite returned non-zero exit code.') : undefined
    };
  } catch (err) {
    return {
      passed: false,
      output: '',
      error: err.message
    };
  }
}

/**
 * Checks for regressions in test files (deleted test assertions).
 * @param {string} diff
 * @returns {{ passed: boolean, deletedLines: string[], details: string }}
 */
function checkTestRegressions(diff) {
  const deletedLines = [];
  const lines = (diff || '').split('\n');
  let currentFile = '';

  for (const line of lines) {
    if (line.startsWith('--- a/')) {
      currentFile = line.replace('--- a/', '').trim();
    } else if (line.startsWith('+++ b/')) {
      // file header
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      const removedText = line.substring(1).trim();
      if (
        (currentFile.includes('tests/') || currentFile.includes('test-flow.js') || currentFile.includes('e2e-test.js')) &&
        (removedText.includes('assert') ||
          removedText.includes('Test ') ||
          removedText.includes('✔') ||
          removedText.includes('execSync(') ||
          removedText.includes('runSync('))
      ) {
        deletedLines.push(`[${currentFile}] ${removedText}`);
      }
    }
  }

  const passed = deletedLines.length === 0;
  return {
    passed,
    deletedLines,
    details: passed
      ? 'No existing test assertions or verification cases were deleted.'
      : `Detected ${deletedLines.length} deleted test assertion(s) in test files.`
  };
}

/**
 * Checks for scope creep and unintended file modifications.
 * @param {string[]} files
 * @returns {{ passed: boolean, warnings: string[], details: string }}
 */
function checkScopeAndFileBleed(files = []) {
  const warnings = [];

  for (const file of files) {
    if (file === 'package-lock.json') {
      warnings.push('package-lock.json was modified. Dependency versions or licenses may have been altered unintentionally.');
    } else if (file.startsWith('.github/workflows/') && !file.includes('pr-review')) {
      warnings.push(`Modified CI workflow file: ${file}. CI matrix modifications require maintainer review.`);
    } else if (file === 'LICENSE') {
      warnings.push('LICENSE file was modified. License terms should not be modified in pull requests.');
    }
  }

  const passed = warnings.length === 0;
  return {
    passed,
    warnings,
    details: passed
      ? 'Clean scope. No unintended lockfile, license, or root file modifications detected.'
      : `${warnings.length} scope warning(s) detected.`
  };
}

/**
 * Checks syntax and catches undeclared reference errors.
 * @param {string[]} files
 * @param {string} diff
 * @param {string} [cwd=process.cwd()]
 * @returns {{ passed: boolean, errors: string[], details: string }}
 */
function checkSyntaxAndReferences(files = [], diff = '', cwd = process.cwd()) {
  const errors = [];
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const headRef = process.env.HEAD_REF;

  for (const jsFile of jsFiles) {
    const content = getFileContent(jsFile, headRef, cwd);
    if (content !== null) {
      try {
        new vm.Script(content, { filename: jsFile });
      } catch (err) {
        errors.push(`Syntax error in ${jsFile}: ${err.message}`);
      }
    }
  }

  // Check diff for common reference mistakes
  const diffLines = (diff || '').split('\n');
  let currentFile = '';
  for (const line of diffLines) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.replace('+++ b/', '').trim();
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      const addedText = line.substring(1);
      if (currentFile.includes('test-flow.js') && addedText.includes('runSync(')) {
        errors.push('Reference error in tests/test-flow.js: "runSync" is undefined (only available in tests/e2e-test.js).');
      }
      if (addedText.includes('assert.include(') || addedText.includes('assert.isFalse(')) {
        errors.push(`Invalid assertion method in ${currentFile}: "assert.include/isFalse" is Chai syntax, not built-in Node assert.`);
      }
      if (addedText.trim().startsWith('test(') && currentFile.includes('tests/')) {
        errors.push(`Undeclared runner function in ${currentFile}: "test()" is not defined in plain Node test runners.`);
      }
    }
  }

  const passed = errors.length === 0;
  return {
    passed,
    errors,
    details: passed
      ? 'All JavaScript files passed syntax verification with 0 undeclared reference errors.'
      : `Found ${errors.length} syntax/reference error(s).`
  };
}

/**
 * Checks that no emojis are present in code or template additions.
 * @param {string} diff
 * @returns {{ passed: boolean, emojiLines: string[], details: string }}
 */
function checkCodeCleanlinessAndEmojis(diff = '') {
  const emojiLines = [];
  const lines = (diff || '').split('\n');
  let currentFile = '';

  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.replace('+++ b/', '').trim();
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      const addedText = line.substring(1);
      if (!currentFile.endsWith('.md') && EMOJI_REGEX.test(addedText)) {
        emojiLines.push(`[${currentFile}] ${addedText.trim()}`);
      }
    }
  }

  const passed = emojiLines.length === 0;
  return {
    passed,
    emojiLines,
    details: passed
      ? 'Code cleanliness verified: 0 forbidden emojis found in code and templates.'
      : `Found ${emojiLines.length} line(s) containing forbidden emojis in code files.`
  };
}

/**
 * Validates template JSON files for required schema fields and placeholder integrity.
 * @param {string[]} files
 * @param {string} [cwd=process.cwd()]
 * @returns {{ passed: boolean, errors: string[], details: string }}
 */
function checkTemplateSchema(files = [], cwd = process.cwd()) {
  const templateFiles = files.filter(f => f.startsWith('templates/') && f.endsWith('.json'));
  const errors = [];
  const headRef = process.env.HEAD_REF;

  for (const tplFile of templateFiles) {
    const raw = getFileContent(tplFile, headRef, cwd);
    if (raw !== null) {
      try {
        const data = JSON.parse(raw);

        if (!data.type || typeof data.type !== 'string') {
          errors.push(`[${tplFile}] Missing required field: "type" (string).`);
        }
        if (!data.title || typeof data.title !== 'string') {
          errors.push(`[${tplFile}] Missing required field: "title" (string).`);
        }
        if (!Array.isArray(data.steps) || data.steps.length === 0) {
          errors.push(`[${tplFile}] Field "steps" must be a non-empty array.`);
        } else {
          data.steps.forEach((step, idx) => {
            if (!step.id) errors.push(`[${tplFile}] Step ${idx + 1} is missing "id".`);
            if (!step.title) errors.push(`[${tplFile}] Step ${idx + 1} is missing "title".`);
            if (!step.prompt) errors.push(`[${tplFile}] Step ${idx + 1} is missing "prompt".`);
            if (!Array.isArray(step.requires)) errors.push(`[${tplFile}] Step ${idx + 1} "requires" must be an array.`);
            if (!Array.isArray(step.writes)) errors.push(`[${tplFile}] Step ${idx + 1} "writes" must be an array.`);
          });
        }
      } catch (err) {
        errors.push(`[${tplFile}] Malformed JSON: ${err.message}`);
      }
    }
  }

  const passed = errors.length === 0;
  return {
    passed,
    errors,
    details: passed
      ? 'Template schema verified: All touched templates conform to specification.'
      : `Template validation failed with ${errors.length} error(s).`
  };
}

/**
 * Calculates overall quality score and status flag.
 * @param {object} checks
 * @returns {{ score: number, flag: string, color: string, canMerge: boolean }}
 */
function calculateQualityScore(checks) {
  let score = 100;

  if (!checks.testExecution.passed) score -= 40;
  if (!checks.testRegressions.passed) score -= 30;
  if (!checks.syntaxAndReferences.passed) score -= 25;
  if (!checks.scopeAndFileBleed.passed) score -= 15;
  if (!checks.codeCleanliness.passed) score -= 10;
  if (!checks.templateSchema.passed) score -= 20;

  score = Math.max(score, 0);

  let flag = 'GREEN FLAG: APPROVED';
  let color = 'green';
  let canMerge = true;

  if (score < 70 || !checks.testExecution.passed || !checks.testRegressions.passed || !checks.syntaxAndReferences.passed) {
    flag = 'RED FLAG: CHANGES REQUIRED';
    color = 'red';
    canMerge = false;
  } else if (score < 90 || !checks.scopeAndFileBleed.passed || !checks.codeCleanliness.passed) {
    flag = 'YELLOW FLAG: REVIEW RECOMMENDED';
    color = 'yellow';
    canMerge = true;
  }

  return { score, flag, color, canMerge };
}

/**
 * Generates markdown review comment without emojis.
 * @param {object} results
 * @returns {string}
 */
function generateMarkdownReport(results) {
  const { checks, scoreData, changedFiles } = results;
  const lines = [];

  lines.push(BOT_SIGNATURE);
  lines.push('## Automated PR Quality Review');
  lines.push('');
  lines.push(`**Merge Status:** [${scoreData.flag}] | **Quality Score:** ${scoreData.score}/100`);
  lines.push('');
  lines.push(
    scoreData.canMerge && scoreData.score >= 90
      ? '> **Recommendation:** Safe to merge. All automated verification gates passed.'
      : scoreData.canMerge
      ? '> **Recommendation:** Mergeable with warnings. Please review non-blocking warnings below.'
      : '> **Recommendation:** DO NOT MERGE. Critical issues or test regressions detected.'
  );
  lines.push('');
  lines.push('### Verification Checks Summary');
  lines.push('');
  lines.push('| Quality Gate | Result | Details |');
  lines.push('| :--- | :---: | :--- |');
  lines.push(`| **Automated Test Suite** | ${checks.testExecution.passed ? '[PASS]' : '[FAIL]'} | ${checks.testExecution.passed ? 'All unit and E2E tests passed.' : 'Test suite failed or threw errors.'} |`);
  lines.push(`| **Test Regression Guard** | ${checks.testRegressions.passed ? '[PASS]' : '[FAIL]'} | ${checks.testRegressions.details} |`);
  lines.push(`| **Syntax & Reference Verification** | ${checks.syntaxAndReferences.passed ? '[PASS]' : '[FAIL]'} | ${checks.syntaxAndReferences.details} |`);
  lines.push(`| **Scope & File Bleed Analysis** | ${checks.scopeAndFileBleed.passed ? '[PASS]' : '[WARN]'} | ${checks.scopeAndFileBleed.details} |`);
  lines.push(`| **Code Cleanliness & Style** | ${checks.codeCleanliness.passed ? '[PASS]' : '[WARN]'} | ${checks.codeCleanliness.details} |`);
  if ((changedFiles || []).some(f => f.startsWith('templates/'))) {
    lines.push(`| **Template Schema Integrity** | ${checks.templateSchema.passed ? '[PASS]' : '[FAIL]'} | ${checks.templateSchema.details} |`);
  }
  lines.push('');

  const hasIssues =
    !checks.testExecution.passed ||
    !checks.testRegressions.passed ||
    !checks.syntaxAndReferences.passed ||
    !checks.scopeAndFileBleed.passed ||
    !checks.codeCleanliness.passed ||
    !checks.templateSchema.passed;

  if (hasIssues) {
    lines.push('### Detailed Findings & Blockers');
    lines.push('');

    if (!checks.testExecution.passed && checks.testExecution.error) {
      lines.push('#### Test Suite Failures:');
      lines.push('```text');
      lines.push(checks.testExecution.error.trim().substring(0, 1500));
      lines.push('```');
      lines.push('');
    }

    if (!checks.testRegressions.passed && checks.testRegressions.deletedLines.length > 0) {
      lines.push('#### Deleted Test Assertions (Regressions):');
      checks.testRegressions.deletedLines.slice(0, 10).forEach(dl => {
        lines.push(`- \`${dl}\``);
      });
      lines.push('');
    }

    if (!checks.syntaxAndReferences.passed && checks.syntaxAndReferences.errors.length > 0) {
      lines.push('#### Syntax / Reference Errors:');
      checks.syntaxAndReferences.errors.forEach(err => {
        lines.push(`- ${err}`);
      });
      lines.push('');
    }

    if (!checks.scopeAndFileBleed.passed && checks.scopeAndFileBleed.warnings.length > 0) {
      lines.push('#### Scope Warnings:');
      checks.scopeAndFileBleed.warnings.forEach(w => {
        lines.push(`- ${w}`);
      });
      lines.push('');
    }

    if (!checks.codeCleanliness.passed && checks.codeCleanliness.emojiLines.length > 0) {
      lines.push('#### Emojis in Code Additions:');
      checks.codeCleanliness.emojiLines.slice(0, 10).forEach(el => {
        lines.push(`- \`${el}\``);
      });
      lines.push('');
    }

    if (!checks.templateSchema.passed && checks.templateSchema.errors.length > 0) {
      lines.push('#### Template Schema Errors:');
      checks.templateSchema.errors.forEach(te => {
        lines.push(`- ${te}`);
      });
      lines.push('');
    }

    lines.push('### Actionable Next Steps for Contributor');
    lines.push('');
    if (!checks.testRegressions.passed) {
      lines.push('1. Rebase your branch on latest `main` and restore any deleted test cases.');
    }
    if (!checks.syntaxAndReferences.passed) {
      lines.push('2. Fix syntax errors and ensure undeclared helper functions are properly defined or imported.');
    }
    if (!checks.testExecution.passed) {
      lines.push('3. Run `npm run test:all` locally and ensure all tests exit with status code 0.');
    }
    if (!checks.scopeAndFileBleed.passed) {
      lines.push('4. Revert unintended edits to `package-lock.json` or root configuration files.');
    }
    if (!checks.codeCleanliness.passed) {
      lines.push('5. Remove emojis from JavaScript and template JSON files.');
    }
    lines.push('');
  } else {
    lines.push('### Verification Complete');
    lines.push('');
    lines.push('All automated checks have passed. This pull request is ready for maintainer review and merge.');
    lines.push('');
  }

  lines.push('---');
  lines.push('*Automated review generated by `build-with-ai-pr-bot`*');

  return lines.join('\n');
}

/**
 * Posts or updates comment on GitHub PR via GitHub REST API.
 * @param {string} token
 * @param {string} repo
 * @param {string|number} prNumber
 * @param {string} body
 * @returns {Promise<void>}
 */
async function postOrUpdateGitHubComment(token, repo, prNumber, body) {
  if (!token || !repo || !prNumber) {
    console.log('GitHub environment variables missing. Skipping GitHub API comment.');
    return;
  }

  const [owner, repoName] = repo.split('/');
  const headers = {
    'User-Agent': 'build-with-ai-pr-bot',
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  const apiRequest = (options, postData) =>
    new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: data ? JSON.parse(data) : {} });
          } catch {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      req.end();
    });

  try {
    const listOptions = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repoName}/issues/${prNumber}/comments?per_page=100`,
      method: 'GET',
      headers
    };
    const listRes = await apiRequest(listOptions);
    const existingComments = Array.isArray(listRes.body) ? listRes.body : [];
    const botComment = existingComments.find(c => c.body && c.body.includes(BOT_SIGNATURE));

    if (botComment) {
      const patchOptions = {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repoName}/issues/comments/${botComment.id}`,
        method: 'PATCH',
        headers
      };
      await apiRequest(patchOptions, { body });
      console.log(`Updated existing PR review comment ID: ${botComment.id}`);
    } else {
      const postOptions = {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
        method: 'POST',
        headers
      };
      await apiRequest(postOptions, { body });
      console.log(`Created new PR review comment on PR #${prNumber}`);
    }
  } catch (err) {
    console.error('Failed to post PR review comment:', err.message);
  }
}

/**
 * Main review coordinator function.
 */
async function runReview(options = {}) {
  const cwd = options.cwd || process.cwd();
  const baseBranch = options.base || 'origin/main';

  console.log('Running build-with-ai Automated PR Reviewer...');

  const { files, diff } = options.mockData || getGitChanges(baseBranch);
  const changedFiles = files || [];

  console.log(`Analyzing ${changedFiles.length} changed file(s)...`);

  const checks = {
    testExecution: options.mockChecks ? options.mockChecks.testExecution : runTestSuites(cwd),
    testRegressions: options.mockChecks ? options.mockChecks.testRegressions : checkTestRegressions(diff),
    scopeAndFileBleed: options.mockChecks ? options.mockChecks.scopeAndFileBleed : checkScopeAndFileBleed(changedFiles),
    syntaxAndReferences: options.mockChecks ? options.mockChecks.syntaxAndReferences : checkSyntaxAndReferences(changedFiles, diff, cwd),
    codeCleanliness: options.mockChecks ? options.mockChecks.codeCleanliness : checkCodeCleanlinessAndEmojis(diff),
    templateSchema: options.mockChecks ? options.mockChecks.templateSchema : checkTemplateSchema(changedFiles, cwd)
  };

  const scoreData = calculateQualityScore(checks);
  const report = generateMarkdownReport({ checks, scoreData, changedFiles });

  console.log('\n========================================');
  console.log(`STATUS: ${scoreData.flag}`);
  console.log(`SCORE:  ${scoreData.score}/100`);
  console.log('========================================\n');

  if (process.env.GITHUB_ACTIONS) {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY;
    const prNumber = process.env.PR_NUMBER;
    await postOrUpdateGitHubComment(token, repo, prNumber, report);
  } else {
    console.log(report);
  }

  return { checks, scoreData, report, canMerge: scoreData.canMerge };
}

if (require.main === module) {
  runReview().catch(err => {
    console.error('PR Review Bot encountered fatal error:', err);
    process.exit(1);
  });
}

module.exports = {
  runReview,
  getGitChanges,
  runTestSuites,
  checkTestRegressions,
  checkScopeAndFileBleed,
  checkSyntaxAndReferences,
  checkCodeCleanlinessAndEmojis,
  checkTemplateSchema,
  calculateQualityScore,
  generateMarkdownReport
};
