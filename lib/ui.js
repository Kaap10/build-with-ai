const pc = require('picocolors');

/**
 * Creates a visual progress bar string.
 * @param {number} current 1-based current step index or completed count
 * @param {number} total
 * @param {number} [barLength=25]
 * @returns {string}
 */
function renderProgressBar(current, total, barLength = 25) {
  if (total <= 0) return '[                    ] 0%';
  const ratio = Math.min(Math.max(current / total, 0), 1);
  const filledLength = Math.round(barLength * ratio);
  const emptyLength = barLength - filledLength;
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  const percent = Math.round(ratio * 100);
  return `${pc.cyan(`[${filled}${empty}]`)} ${pc.bold(`${percent}%`)} (${current}/${total} steps)`;
}

/**
 * Formats and prints the step display block for `next`.
 * Supports optional targetFiles and recommendedAI fields.
 *
 * @param {object} params
 * @param {number} params.stepNum
 * @param {number} params.totalSteps
 * @param {string} params.title
 * @param {string} params.phase
 * @param {string} params.goal
 * @param {string} params.expectedOutput
 * @param {string} params.prompt
 * @param {string[]} [params.warnings]
 * @param {string[]} [params.targetFiles]
 * @param {string} [params.recommendedAI]
 */
function displayStep({ stepNum, totalSteps, title, phase, goal, expectedOutput, prompt, warnings = [], targetFiles = [], recommendedAI = '' }) {
  console.log('\n' + pc.bold(pc.bgCyan(pc.black(` STEP ${stepNum}/${totalSteps} — ${title} `))));
  console.log();

  if (phase) {
    console.log(`${pc.bold('PHASE:')} ${pc.magenta(phase)}`);
  }
  if (recommendedAI) {
    console.log(`${pc.bold('RECOMMENDED AI:')} ${pc.green(recommendedAI)}`);
  }
  if (targetFiles && targetFiles.length > 0) {
    console.log(`${pc.bold('TARGET FILES:')} ${pc.cyan(targetFiles.join(', '))}`);
  }
  if (phase || recommendedAI || (targetFiles && targetFiles.length > 0)) {
    console.log();
  }

  console.log(pc.bold(pc.yellow('WHY THIS STEP: ')) + goal);
  console.log(pc.bold(pc.green('WHAT AI SHOULD PRODUCE: ')) + expectedOutput);
  console.log();

  if (warnings && warnings.length > 0) {
    console.log(pc.yellow('Warning — Context Gaps:'));
    for (const w of warnings) {
      console.log(pc.yellow(`  • ${w}`));
    }
    console.log();
  }

  console.log(pc.dim('─'.repeat(60)));
  console.log(pc.bold('PROMPT FOR YOUR AI:'));
  console.log(pc.dim('─'.repeat(60)));
  console.log(prompt);
  console.log(pc.dim('─'.repeat(60)));
}

/**
 * Formats a key-value summary table.
 * @param {string} title
 * @param {Array<[string, string]>} pairs
 */
function displayKeyValueTable(title, pairs) {
  if (title) {
    console.log('\n' + pc.bold(pc.cyan(title)));
  }
  for (const [key, val] of pairs) {
    console.log(`  ${pc.dim('•')} ${pc.bold(key)}: ${val || pc.dim('Not set')}`);
  }
}

/**
 * Prints a banner header for build-with-ai
 */
function displayBanner() {
  console.log(pc.bold(pc.cyan(`
 ╔════════════════════════════════════════════════╗
 ║           build-with-ai  v1.1                  ║
 ║  Zero-API, Step-by-Step AI Project Copilot    ║
 ╚════════════════════════════════════════════════╝`)));
}

module.exports = {
  renderProgressBar,
  displayStep,
  displayKeyValueTable,
  displayBanner
};
