const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  isInitialized,
  initState,
  loadState,
  saveState,
  loadContext,
  saveContext,
  saveHistory,
  loadHistory,
  getAllHistory,
  resetProject,
  getStorageDir
} = require('../lib/state');

const {
  loadTemplates,
  getTemplate,
  resolveStepPrompt
} = require('../lib/promptEngine');

const {
  getByPath,
  setByPath,
  flattenObject,
  formatContextAsMarkdown
} = require('../lib/contextBuilder');

const {
  runExport,
  generateReadme,
  generateBuildLog
} = require('../lib/export');

const { copyToClipboard } = require('../lib/clipboard');

async function runTests() {
  console.log('🧪 Starting build-with-ai Test Suite...\n');

  // Test 1: Template Loading & Verification
  console.log('▶ Test 1: Templates Loading');
  const templates = loadTemplates();
  assert(templates.length >= 2, 'Should load at least 2 templates');
  
  const webAppTemplate = getTemplate('web-app');
  assert(webAppTemplate !== null, 'web-app template must exist');
  assert(webAppTemplate.stepCount >= 20, `web-app template should have >= 20 steps, found ${webAppTemplate.stepCount}`);
  assert(webAppTemplate.steps[0].id === 'step-01-discovery', 'Step 1 should be discovery');
  assert(Array.isArray(webAppTemplate.steps[0].requires), 'Step 1 requires must be array');
  assert(Array.isArray(webAppTemplate.steps[0].writes), 'Step 1 writes must be array');
  console.log('  ✔ Templates loaded successfully with dynamic step counts.');

  // Create isolated temp workspace
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'buildwithai-test-'));
  console.log(`\n▶ Test 2: State & Storage Management in ${tempDir}`);
  
  assert.strictEqual(isInitialized(tempDir), false, 'Should not be initialized yet');

  // Init project
  const state = initState({
    projectName: 'Expense Tracker',
    templateId: 'web-app',
    templateTitle: 'Full-Stack Web Application',
    experienceLevel: 'Beginner',
    projectIdea: 'A minimalist expense tracker for freelancers',
    totalSteps: webAppTemplate.stepCount
  }, tempDir);

  assert.strictEqual(isInitialized(tempDir), true, 'Should now be initialized');
  assert.strictEqual(state.currentStep, 1, 'Current step should start at 1');
  assert.strictEqual(state.completedSteps.length, 0, 'Completed steps should be empty');

  // Check initial context
  const context = loadContext(tempDir);
  assert.strictEqual(context.project.name, 'Expense Tracker');
  assert.strictEqual(context.project.type, 'web-app');
  assert.strictEqual(context.project.experienceLevel, 'Beginner');
  assert.strictEqual(context.project.idea, 'A minimalist expense tracker for freelancers');
  console.log('  ✔ State and initial context initialized correctly.');

  // Test 3: Prompt Engine Resolution for Step 1
  console.log('\n▶ Test 3: Prompt Resolution for Step 1');
  const step1 = webAppTemplate.steps[0];
  const res1 = resolveStepPrompt(step1, context);
  assert(res1.resolvedPrompt.includes('Expense Tracker'), 'Prompt must contain resolved project name');
  assert(res1.resolvedPrompt.includes('Beginner'), 'Prompt must contain resolved experience level');
  assert.strictEqual(res1.warnings.length, 0, 'Step 1 has all required keys in initial context');
  console.log('  ✔ Step 1 prompt interpolated without warnings.');

  // Test 4: Clipboard copying
  console.log('\n▶ Test 4: Safe Clipboard Copy');
  const copied = await copyToClipboard(res1.resolvedPrompt);
  console.log(`  ✔ copyToClipboard executed safely (result: ${copied})`);

  // Test 5: Simulating Step 1 Completion (`done`)
  console.log('\n▶ Test 5: Simulating Step 1 Completion');
  setByPath(context, 'decisions.targetAudience', 'Freelancers and digital nomads');
  setByPath(context, 'decisions.coreValueProp', 'Instantly capture receipts and categorize expenses with zero friction.');
  saveContext(context, tempDir);

  saveHistory(1, '# Step 1 AI Response\n\nTarget Persona: Freelancer Alex\nPain Point: Loses receipts at tax time.\nValue Prop: Single-click receipt categorization.', tempDir);

  const loadedHist1 = loadHistory(1, tempDir);
  assert(loadedHist1.includes('Freelancer Alex'), 'History file must contain raw response');

  state.completedSteps.push(1);
  state.currentStep = 2;
  saveState(state, tempDir);

  const updatedState = loadState(tempDir);
  assert.strictEqual(updatedState.currentStep, 2);
  assert.deepStrictEqual(updatedState.completedSteps, [1]);
  console.log('  ✔ Step 1 saved to history, context updated, state advanced to 2.');

  // Test 6: Step 2 and Step 3 Resolution with Context Injection
  console.log('\n▶ Test 6: Context Injection into Step 2');
  const step2 = webAppTemplate.steps[1];
  const res2 = resolveStepPrompt(step2, context);
  assert(res2.resolvedPrompt.includes('Instantly capture receipts'), 'Step 2 must inject decisions.coreValueProp from step 1');
  console.log('  ✔ Step 2 prompt correctly received context from Step 1.');

  // Simulate Step 2 Completion
  setByPath(context, 'decisions.mvpFeatures', ['Receipt upload', 'Category breakdown dashboard', 'CSV export']);
  saveContext(context, tempDir);
  state.completedSteps.push(2);
  state.currentStep = 3;
  saveState(state, tempDir);

  // Step 3 requires tech stack
  console.log('\n▶ Test 7: Context Injection into Step 3 & 4');
  setByPath(context, 'decisions.frontendStack', 'Next.js 14 + Tailwind CSS');
  setByPath(context, 'decisions.backendStack', 'Next.js App Router API');
  setByPath(context, 'decisions.database', 'PostgreSQL with Prisma');
  saveContext(context, tempDir);

  const step4 = webAppTemplate.steps[3];
  const res4 = resolveStepPrompt(step4, context);
  assert(res4.resolvedPrompt.includes('Next.js 14 + Tailwind CSS'), 'Step 4 prompt has frontendStack');
  assert(res4.resolvedPrompt.includes('PostgreSQL with Prisma'), 'Step 4 prompt has database');
  console.log('  ✔ Multi-step context injection verified end-to-end.');

  // Test 8: Missing Requires Warning Check
  console.log('\n▶ Test 8: Missing Requires Warning Detection');
  const emptyContext = { project: { name: 'Test' } };
  const resMissing = resolveStepPrompt(step4, emptyContext);
  assert(resMissing.warnings.length > 0, 'Should detect missing required keys');
  assert(resMissing.missingKeys.includes('decisions.database'), 'Should identify missing database key');
  assert(resMissing.resolvedPrompt.includes('[MISSING: decisions.database]'), 'Should flag missing placeholder cleanly');
  console.log('  ✔ Missing requirements flagged cleanly without silent undefined injection.');

  // Test 9: `back` Command Logic
  console.log('\n▶ Test 9: Back Navigation');
  const stepBeforeBack = state.currentStep;
  state.currentStep = Math.max(1, state.currentStep - 1);
  state.completedSteps = state.completedSteps.filter(s => s !== state.currentStep);
  saveState(state, tempDir);

  const stateAfterBack = loadState(tempDir);
  assert.strictEqual(stateAfterBack.currentStep, stepBeforeBack - 1, 'Current step should decrement');
  assert(fs.existsSync(path.join(tempDir, '.buildwithai', 'history', 'step-01.md')), 'History file must NOT be deleted on back');
  console.log('  ✔ Back command moved step back while preserving history.');

  // Restore step for export test
  state.currentStep = 3;
  saveState(state, tempDir);

  // Test 10: Export Documentation
  console.log('\n▶ Test 10: Export (README.md, BUILD_LOG.md, CONTEXT.md)');
  runExport(tempDir);

  assert(fs.existsSync(path.join(tempDir, 'README.md')), 'README.md must be generated');
  assert(fs.existsSync(path.join(tempDir, 'BUILD_LOG.md')), 'BUILD_LOG.md must be generated');
  assert(fs.existsSync(path.join(tempDir, '.buildwithai', 'CONTEXT.md')), 'CONTEXT.md must be generated');

  const readmeContent = fs.readFileSync(path.join(tempDir, 'README.md'), 'utf8');
  assert(readmeContent.includes('Expense Tracker'), 'README must contain project name');
  assert(readmeContent.includes('Next.js 14 + Tailwind CSS'), 'README must contain chosen frontend');
  assert(readmeContent.includes('PostgreSQL with Prisma'), 'README must contain chosen database');

  const buildLogContent = fs.readFileSync(path.join(tempDir, 'BUILD_LOG.md'), 'utf8');
  assert(buildLogContent.includes('Freelancer Alex'), 'BUILD_LOG must contain raw step history');

  const contextMdContent = fs.readFileSync(path.join(tempDir, '.buildwithai', 'CONTEXT.md'), 'utf8');
  assert(contextMdContent.includes('Project Context & Architecture Decisions'), 'CONTEXT.md header check');
  console.log('  ✔ All export files generated with deterministic content.');

  // Test 11: Reset Project
  console.log('\n▶ Test 11: Reset Project (.buildwithai cleanup)');
  // Create a dummy user source file to make sure it is not touched
  fs.writeFileSync(path.join(tempDir, 'my-source-code.js'), 'console.log("hello")', 'utf8');
  
  resetProject(tempDir);
  assert.strictEqual(isInitialized(tempDir), false, 'Storage should be wiped');
  assert.strictEqual(fs.existsSync(getStorageDir(tempDir)), false, '.buildwithai dir removed');
  assert.strictEqual(fs.existsSync(path.join(tempDir, 'my-source-code.js')), true, 'User code preserved intact');
  console.log('  ✔ Reset cleaned .buildwithai and preserved user source files.');

  // Cleanup temp dir
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! ✅\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

