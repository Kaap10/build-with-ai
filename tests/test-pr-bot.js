const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
  checkTestRegressions,
  checkScopeAndFileBleed,
  checkSyntaxAndReferences,
  checkCodeCleanlinessAndEmojis,
  checkTemplateSchema,
  calculateQualityScore,
  generateMarkdownReport
} = require('../.github/scripts/pr-review-bot');

async function runPRBotTests() {
  console.log('Starting PR Review Bot Test Suite...\n');

  // Test 1: Clean Green PR Scenario
  console.log('Test 1: Clean Green PR Quality Scoring');
  const cleanChecks = {
    testExecution: { passed: true, output: 'All tests passed' },
    testRegressions: { passed: true, deletedLines: [], details: 'No deleted tests' },
    scopeAndFileBleed: { passed: true, warnings: [], details: 'Clean scope' },
    syntaxAndReferences: { passed: true, errors: [], details: 'Zero errors' },
    codeCleanliness: { passed: true, emojiLines: [], details: 'Zero emojis' },
    templateSchema: { passed: true, errors: [], details: 'Schema valid' }
  };
  const cleanScore = calculateQualityScore(cleanChecks);
  assert.strictEqual(cleanScore.score, 100, 'Clean PR should score 100');
  assert.strictEqual(cleanScore.canMerge, true, 'Clean PR should be mergeable');
  assert(cleanScore.flag.includes('GREEN FLAG'), 'Clean PR should get green flag');
  console.log('  Passed: Clean PR correctly scored 100 with Green Flag.');

  // Test 2: Regression Check (Deleted tests)
  console.log('\nTest 2: Test Regression Detection');
  const regressiveDiff = '--- a/tests/test-flow.js\n+++ b/tests/test-flow.js\n@@ -10,2 +10,2 @@\n- assert.strictEqual(output, 23);\n+ console.log(\'dummy\');';
  const regressionResult = checkTestRegressions(regressiveDiff);
  assert.strictEqual(regressionResult.passed, false, 'Deleted assert must fail regression check');
  assert.strictEqual(regressionResult.deletedLines.length, 1, 'Should detect 1 deleted assert line');
  console.log('  Passed: Deleted test assertions flagged as regression.');

  // Test 3: Scope and File Bleed Check
  console.log('\nTest 3: Scope Bleed Detection');
  const bleedResult = checkScopeAndFileBleed(['package-lock.json', 'lib/init.js']);
  assert.strictEqual(bleedResult.passed, false, 'package-lock.json modification must trigger scope warning');
  assert(bleedResult.warnings[0].includes('package-lock.json'), 'Warning must mention package-lock.json');
  console.log('  Passed: Lockfile and scope bleed detected accurately.');

  // Test 4: Reference Error Detection (e.g. undefined runSync)
  console.log('\nTest 4: Reference Error Detection in Diffs');
  const brokenDiff = '--- a/tests/test-flow.js\n+++ b/tests/test-flow.js\n@@ -50,2 +50,2 @@\n+ const res = runSync([\'resume\'], tempDir);\n+ assert.include(res, \'test\');';
  const refResult = checkSyntaxAndReferences(['tests/test-flow.js'], brokenDiff);
  assert.strictEqual(refResult.passed, false, 'Undefined runSync and Chai assertions must be flagged');
  assert(refResult.errors.some(e => e.includes('runSync')), 'Should flag undefined runSync');
  assert(refResult.errors.some(e => e.includes('assert.include')), 'Should flag invalid Chai method');
  console.log('  Passed: Undefined runSync and invalid assertion methods flagged.');

  // Test 5: Emoji Detection in Code Additions
  console.log('\nTest 5: Emoji Detection in Code & Templates');
  const emojiDiff = '--- a/lib/init.js\n+++ b/lib/init.js\n@@ -10,2 +10,2 @@\n+ console.log(\'Welcome \u{1F680} to the app\');';
  const emojiResult = checkCodeCleanlinessAndEmojis(emojiDiff);
  assert.strictEqual(emojiResult.passed, false, 'Emoji in code additions must be flagged');
  assert.strictEqual(emojiResult.emojiLines.length, 1, 'Should find 1 emoji line');
  console.log('  Passed: Emojis in code files correctly detected and flagged.');

  // Test 6: Template Schema Validation
  console.log('\nTest 6: Template Schema Validation');
  const schemaResult = checkTemplateSchema(['templates/web-app.json', 'templates/flutter-app.json']);
  assert.strictEqual(schemaResult.passed, true, 'Existing built-in templates must pass schema validation');
  console.log('  Passed: Existing templates verified with 0 schema errors.');

  // Test 7: Score Deduction & Red Flag Status
  console.log('\nTest 7: Broken PR Quality Score Deduction');
  const brokenChecks = {
    testExecution: { passed: false, error: 'ReferenceError: runSync is not defined' },
    testRegressions: { passed: false, deletedLines: ['deleted assert'], details: 'Regressions found' },
    scopeAndFileBleed: { passed: false, warnings: ['package-lock.json modified'], details: 'Bleed found' },
    syntaxAndReferences: { passed: false, errors: ['runSync undefined'], details: 'Syntax error' },
    codeCleanliness: { passed: true, emojiLines: [], details: 'Zero emojis' },
    templateSchema: { passed: true, errors: [], details: 'Valid' }
  };
  const brokenScore = calculateQualityScore(brokenChecks);
  assert(brokenScore.score < 50, `Broken PR score should be < 50, got ${brokenScore.score}`);
  assert.strictEqual(brokenScore.canMerge, false, 'Broken PR must not be mergeable');
  assert(brokenScore.flag.includes('RED FLAG'), 'Broken PR must get RED FLAG');
  console.log('  Passed: Broken PR correctly scored with Red Flag (Do Not Merge).');

  // Test 8: Zero-Emoji Guarantee in Generated Markdown Report
  console.log('\nTest 8: Zero-Emoji Guarantee in Generated Report');
  const report = generateMarkdownReport({
    checks: brokenChecks,
    scoreData: brokenScore,
    changedFiles: ['tests/test-flow.js', 'package-lock.json']
  });
  const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
  assert.strictEqual(EMOJI_REGEX.test(report), false, 'Generated review report must contain 0 emojis');
  assert(report.includes('[RED FLAG: CHANGES REQUIRED]'), 'Report must include red flag tag');
  assert(report.includes('Actionable Next Steps for Contributor'), 'Report must include actionable steps');
  console.log('  Passed: Generated Markdown report verified with 0 emojis and complete action items.');

  console.log('\nAll PR Review Bot tests completed successfully.');
}

runPRBotTests().catch(err => {
  console.error('PR Bot test failed:', err);
  process.exit(1);
});
