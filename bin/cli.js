#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const pc = require('picocolors');

const {
  isInitialized,
  loadState,
  saveState,
  loadContext,
  saveContext,
  saveHistory,
  resetProject
} = require('../lib/state');
const { loadTemplates, getTemplate, resolveStepPrompt } = require('../lib/promptEngine');
const { setByPath } = require('../lib/contextBuilder');
const { copyToClipboard } = require('../lib/clipboard');
const { displayStep, renderProgressBar, displayBanner } = require('../lib/ui');
const { runInit } = require('../lib/init');
const { runResume } = require('../lib/resume');
const { runExport } = require('../lib/export');
const logger = require('../lib/logger');

const program = new Command();

program
  .name('build-with-ai')
  .description('A minimal, zero-API CLI guiding developers through building software projects with AI.')
  .version('1.0.0');

// 1. `init` command
program
  .command('init')
  .description('Initialize a new AI-guided project workflow in the current directory.')
  .option('-f, --force', 'Force re-initialization if project already exists')
  .action(async (options) => {
    await runInit(options);
  });

// 2. `next` command
program
  .command('next')
  .description('Generate and copy the prompt for the current step.')
  .action(async () => {
    if (!isInitialized()) {
      logger.error('No project found in this directory. Run `npx build-with-ai init` first.');
      process.exit(1);
    }

    const state = loadState();
    const context = loadContext();
    const template = getTemplate(state.templateId);

    if (!template) {
      logger.error(`Template "${state.templateId}" not found. Run \`npx build-with-ai list\` to view available templates.`);
      process.exit(1);
    }

    const totalSteps = template.steps ? template.steps.length : 0;
    const currentStepNum = state.currentStep || 1;

    if (currentStepNum > totalSteps) {
      console.log();
      logger.success(pc.bold('🎉 Congratulations! You have completed all steps in this template.'));
      console.log();
      console.log(pc.cyan('Run ') + pc.bold(pc.green('npx build-with-ai export')) + pc.cyan(' to generate your README, BUILD_LOG, and CONTEXT documentation.'));
      console.log();
      return;
    }

    const currentStep = template.steps[currentStepNum - 1];
    const { resolvedPrompt, warnings } = resolveStepPrompt(currentStep, context);

    displayStep({
      stepNum: currentStepNum,
      totalSteps,
      title: currentStep.title,
      goal: currentStep.goal,
      expectedOutput: currentStep.expectedOutput,
      prompt: resolvedPrompt,
      warnings
    });

    const copied = await copyToClipboard(resolvedPrompt);
    console.log();
    if (copied) {
      console.log(pc.green(pc.bold('Prompt copied to clipboard ✅')));
    } else {
      console.log(pc.yellow('ℹ Copy the prompt above and paste it into your AI assistant.'));
    }
    console.log();
    console.log(pc.dim(`When done with your AI conversation, run: `) + pc.bold(pc.cyan('npx build-with-ai done')));
    console.log();
  });

// 3. `done` command
program
  .command('done')
  .description('Record AI decisions/response for the current step and advance.')
  .action(async () => {
    if (!isInitialized()) {
      logger.error('No project found in this directory. Run `npx build-with-ai init` first.');
      process.exit(1);
    }

    const state = loadState();
    const context = loadContext();
    const template = getTemplate(state.templateId);

    if (!template) {
      logger.error(`Template "${state.templateId}" not found.`);
      process.exit(1);
    }

    const totalSteps = template.steps ? template.steps.length : 0;
    const currentStepNum = state.currentStep || 1;

    if (currentStepNum > totalSteps) {
      logger.info('All steps have already been completed.');
      console.log(pc.cyan('Run ') + pc.bold(pc.green('npx build-with-ai export')) + pc.cyan(' to generate documentation.'));
      return;
    }

    const currentStep = template.steps[currentStepNum - 1];
    const stepWrites = Array.isArray(currentStep.writes) ? currentStep.writes : [];

    console.log('\n' + pc.bold(pc.cyan(`Completing Step ${currentStepNum}/${totalSteps}: ${currentStep.title}`)));
    console.log();

    // 1. Ask how user wants to record this step
    const { recordChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'recordChoice',
        message: 'How would you like to record the result of this step?',
        choices: [
          { name: 'Enter short summary / decisions (Recommended for context injection)', value: 'decisions' },
          { name: 'Paste full AI response (Saves raw markdown to history/)', value: 'full' },
          { name: 'Both (Enter decisions AND save full AI response)', value: 'both' },
          { name: 'Skip saving details (Just mark step complete)', value: 'skip' }
        ]
      }
    ]);

    // Full AI response
    if (recordChoice === 'full' || recordChoice === 'both') {
      const { fullResponse } = await inquirer.prompt([
        {
          type: 'input',
          name: 'fullResponse',
          message: 'Paste or enter the AI response (single line or markdown summary):',
          default: ''
        }
      ]);

      if (fullResponse && fullResponse.trim()) {
        const savedPath = saveHistory(currentStepNum, fullResponse.trim());
        logger.success(`Saved response to ${savedPath}`);
      }
    }

    // Decisions input
    if (recordChoice === 'decisions' || recordChoice === 'both') {
      console.log();
      console.log(pc.bold(pc.yellow('Recording key decisions for future step prompts:')));

      if (stepWrites.length > 0) {
        for (const writeKey of stepWrites) {
          const keyLabel = writeKey.replace(/^decisions\./, '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const { val } = await inquirer.prompt([
            {
              type: 'input',
              name: 'val',
              message: `Decision for "${keyLabel}" (${writeKey}):`,
              default: ''
            }
          ]);
          if (val && val.trim()) {
            setByPath(context, writeKey, val.trim());
          }
        }
      } else {
        const { generalDecision } = await inquirer.prompt([
          {
            type: 'input',
            name: 'generalDecision',
            message: 'Summary / decision for this step:',
            default: ''
          }
        ]);
        if (generalDecision && generalDecision.trim()) {
          setByPath(context, `decisions.${currentStep.id.replace(/-/g, '_')}`, generalDecision.trim());
        }
      }

      saveContext(context);
      logger.success('Saved decisions to context.json');
    }

    // Soft-check confirmation if step declares writes
    if (stepWrites.length > 0) {
      console.log();
      console.log(pc.bold('Expected outcomes for this step:'));
      for (const w of stepWrites) {
        const label = w.replace(/^decisions\./, '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`  ${pc.dim('•')} ${label}`);
      }
      console.log();

      await inquirer.prompt([
        {
          type: 'list',
          name: 'confirmDecision',
          message: 'Have these been decided?',
          choices: [
            { name: 'Yes, continue', value: 'yes' },
            { name: 'Not yet', value: 'not_yet' },
            { name: 'Review later', value: 'later' }
          ]
        }
      ]);
    }

    // Mark step complete and advance
    if (!state.completedSteps.includes(currentStepNum)) {
      state.completedSteps.push(currentStepNum);
    }
    state.currentStep = currentStepNum + 1;
    saveState(state);

    console.log();
    logger.success(pc.bold(`Step ${currentStepNum} completed! Advanced to Step ${state.currentStep}/${totalSteps}.`));
    console.log();

    if (state.currentStep <= totalSteps) {
      console.log(pc.cyan('👉 Next: Run ') + pc.bold(pc.green('npx build-with-ai next')) + pc.cyan(' to generate the next prompt.'));
    } else {
      console.log(pc.green('🎉 All workflow steps completed!'));
      console.log(pc.cyan('👉 Run ') + pc.bold(pc.green('npx build-with-ai export')) + pc.cyan(' to generate README.md and documentation.'));
    }
    console.log();
  });

// 4. `back` command
program
  .command('back')
  .description('Move back to the previous step without deleting history.')
  .action(() => {
    if (!isInitialized()) {
      logger.error('No project found in this directory.');
      process.exit(1);
    }

    const state = loadState();
    const current = state.currentStep || 1;

    if (current <= 1) {
      logger.warn('Already at the first step (Step 1). Cannot go further back.');
      return;
    }

    const prev = current - 1;
    state.currentStep = prev;
    // Remove from completed steps if present so it reflects active state
    state.completedSteps = (state.completedSteps || []).filter(s => s !== prev);
    saveState(state);

    console.log();
    logger.success(`Moved back to Step ${prev}.`);
    console.log(pc.dim('History and recorded decisions were preserved.'));
    console.log(pc.cyan('Run ') + pc.bold(pc.green('npx build-with-ai next')) + pc.cyan(' to view this step prompt.'));
    console.log();
  });

// 5. `status` command
program
  .command('status')
  .description('Display project progress, step status list, and recorded decisions.')
  .action(() => {
    if (!isInitialized()) {
      logger.error('No project found in this directory. Run `npx build-with-ai init` first.');
      process.exit(1);
    }

    const state = loadState();
    const context = loadContext();
    const template = getTemplate(state.templateId);

    const totalSteps = template ? template.steps.length : state.totalSteps || 0;
    const currentStepNum = state.currentStep || 1;
    const completedList = state.completedSteps || [];

    console.log();
    console.log(pc.bold(pc.cyan(`PROJECT STATUS: ${state.projectName}`)));
    console.log(pc.dim('─'.repeat(55)));
    console.log(`${pc.bold('Template:')} ${state.templateTitle || state.templateId}`);
    console.log(`${pc.bold('Experience:')} ${state.experienceLevel}`);
    console.log(`${pc.bold('Idea:')} ${state.projectIdea}`);
    console.log(`${pc.bold('Progress:')} ${renderProgressBar(completedList.length, totalSteps)}`);
    console.log();

    if (template && template.steps) {
      console.log(pc.bold('WORKFLOW STEPS:'));
      template.steps.forEach((step, idx) => {
        const stepNum = idx + 1;
        let prefix;
        let titleFormatted;

        if (completedList.includes(stepNum)) {
          prefix = pc.green('  ✔');
          titleFormatted = pc.dim(`${stepNum}. ${step.title} [${step.phase || 'General'}]`);
        } else if (stepNum === currentStepNum) {
          prefix = pc.cyan('  ➤');
          titleFormatted = pc.bold(pc.cyan(`${stepNum}. ${step.title} [${step.phase || 'General'}] (Current)`));
        } else {
          prefix = pc.dim('  ○');
          titleFormatted = pc.dim(`${stepNum}. ${step.title} [${step.phase || 'General'}]`);
        }
        console.log(`${prefix} ${titleFormatted}`);
      });
      console.log();
    }

    const decisions = context.decisions || {};
    const entries = Object.entries(decisions);
    if (entries.length > 0) {
      console.log(pc.bold(pc.magenta('RECORDED DECISIONS:')));
      for (const [k, v] of entries) {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
        console.log(`  ${pc.dim('•')} ${pc.bold(label)}: ${valStr}`);
      }
      console.log();
    }
  });

// 6. `resume` command
program
  .command('resume')
  .description('Resume workflow and show a welcome-back overview.')
  .action(() => {
    runResume();
  });

// 7. `export` command
program
  .command('export')
  .description('Export README.md, BUILD_LOG.md, and .buildwithai/CONTEXT.md.')
  .action(() => {
    if (!isInitialized()) {
      logger.error('No project found in this directory. Run `npx build-with-ai init` first.');
      process.exit(1);
    }
    runExport();
  });

// 8. `list` command
program
  .command('list')
  .description('List all available project templates and their step counts.')
  .action(() => {
    const templates = loadTemplates();
    console.log();
    console.log(pc.bold(pc.cyan('AVAILABLE TEMPLATES:')));
    console.log(pc.dim('─'.repeat(55)));

    if (templates.length === 0) {
      console.log(pc.yellow('No templates found in templates directory.'));
      return;
    }

    templates.forEach((tpl, idx) => {
      console.log(`${pc.bold(`${idx + 1}. ${tpl.title}`)} (${pc.green(`${tpl.stepCount} steps`)})`);
      console.log(`   ${pc.dim('Type / ID:')} ${pc.cyan(tpl.id)}`);
      if (tpl.description) {
        console.log(`   ${pc.dim('Description:')} ${tpl.description}`);
      }
      console.log();
    });
  });

// 9. `reset` command
program
  .command('reset')
  .description('Reset the .buildwithai state for the current project (never touches user code).')
  .action(async () => {
    if (!isInitialized()) {
      logger.info('No .buildwithai configuration found in this directory.');
      return;
    }

    const { confirmReset } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmReset',
        message: pc.yellow('Are you sure you want to reset and delete all .buildwithai progress in this directory?'),
        default: false
      }
    ]);

    if (!confirmReset) {
      logger.info('Reset cancelled.');
      return;
    }

    resetProject();
    logger.success('Reset .buildwithai directory. Source files were not touched.');
    console.log();
  });

// Default action (no subcommand provided)
program.action(async () => {
  displayBanner();
  console.log();

  if (isInitialized()) {
    const state = loadState();
    const template = getTemplate(state.templateId);
    const totalSteps = template ? template.steps.length : state.totalSteps || 0;
    const completedCount = Array.isArray(state.completedSteps) ? state.completedSteps.length : 0;

    console.log(`${pc.bold('Active Project:')} ${pc.cyan(state.projectName || 'Current Project')}`);
    console.log(`${pc.bold('Progress:')} ${renderProgressBar(completedCount, totalSteps)}`);
    console.log();

    const { nextAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'nextAction',
        message: 'What would you like to do?',
        choices: [
          { name: 'Generate current step prompt (next)', value: 'next' },
          { name: 'Resume overview (resume)', value: 'resume' },
          { name: 'View detailed project status (status)', value: 'status' },
          { name: 'Export documentation (export)', value: 'export' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);

    if (nextAction === 'next') {
      const currentStepNum = state.currentStep || 1;
      if (currentStepNum > totalSteps) {
        logger.success('All steps completed! Run `export` to generate documentation.');
        return;
      }
      const currentStep = template.steps[currentStepNum - 1];
      const context = loadContext();
      const { resolvedPrompt, warnings } = resolveStepPrompt(currentStep, context);

      displayStep({
        stepNum: currentStepNum,
        totalSteps,
        title: currentStep.title,
        goal: currentStep.goal,
        expectedOutput: currentStep.expectedOutput,
        prompt: resolvedPrompt,
        warnings
      });

      const copied = await copyToClipboard(resolvedPrompt);
      console.log();
      if (copied) {
        console.log(pc.green(pc.bold('Prompt copied to clipboard ✅')));
      } else {
        console.log(pc.yellow('ℹ Copy the prompt above and paste it into your AI assistant.'));
      }
      console.log();
      console.log(pc.dim(`When done with your AI conversation, run: `) + pc.bold(pc.cyan('npx build-with-ai done')));
      console.log();
    } else if (nextAction === 'resume') {
      runResume();
    } else if (nextAction === 'status') {
      // Trigger status logic
      const context = loadContext();
      console.log();
      console.log(pc.bold(pc.cyan(`PROJECT STATUS: ${state.projectName}`)));
      console.log(pc.dim('─'.repeat(55)));
      console.log(`${pc.bold('Template:')} ${state.templateTitle || state.templateId}`);
      console.log(`${pc.bold('Experience:')} ${state.experienceLevel}`);
      console.log(`${pc.bold('Idea:')} ${state.projectIdea}`);
      console.log(`${pc.bold('Progress:')} ${renderProgressBar(completedCount, totalSteps)}`);
      console.log();
    } else if (nextAction === 'export') {
      runExport();
    }
  } else {
    console.log(pc.yellow('No active project found in this directory.'));
    const { startInit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'startInit',
        message: 'Would you like to initialize a new project with build-with-ai now?',
        default: true
      }
    ]);

    if (startInit) {
      await runInit();
    } else {
      console.log();
      console.log(pc.dim('You can run ') + pc.bold('npx build-with-ai init') + pc.dim(' whenever you are ready!'));
      console.log();
    }
  }
});

program.parse(process.argv);

