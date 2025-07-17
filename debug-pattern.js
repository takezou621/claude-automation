const BranchPatternManager = require('./src/branch-pattern-manager');

const manager = new BranchPatternManager();

const issue = {
  number: 456,
  type: 'bug',
  priority: 'high',
  labels: ['bug']
};

console.log('Testing pattern selection for bug issue:');
console.log('Issue:', issue);

// Get all patterns and their scores
const allPatterns = [...manager.patterns, ...manager.customPatterns];
console.log('\nPattern scores:');

// Test the actual selectOptimalPattern method to see the scoring
console.log('\nTesting selectOptimalPattern method:');
const selectedPattern = manager.selectOptimalPattern(issue);
console.log('Selected pattern:', selectedPattern);