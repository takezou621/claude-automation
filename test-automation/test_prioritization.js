// Test issue prioritization and filtering
console.log('🎯 Testing Issue Prioritization and Filtering\n');

const testIssues = [
  {
    number: 200,
    title: 'Low priority documentation update',
    labels: [{ name: 'documentation' }, { name: 'priority:low' }, { name: 'claude-ready' }]
  },
  {
    number: 201,
    title: 'Critical security breach',
    labels: [{ name: 'security' }, { name: 'priority:critical' }, { name: 'automation-ready' }]
  },
  {
    number: 202,
    title: 'Medium priority feature request',
    labels: [{ name: 'feature' }, { name: 'priority:medium' }, { name: 'automate' }]
  },
  {
    number: 203,
    title: 'High priority bug fix',
    labels: [{ name: 'bug' }, { name: 'priority:high' }, { name: 'auto-fix' }]
  },
  {
    number: 204,
    title: 'Won\'t fix issue',
    labels: [{ name: 'wontfix' }, { name: 'claude-ready' }]
  },
  {
    number: 205,
    title: 'Manual only task',
    labels: [{ name: 'manual-only' }, { name: 'automate' }]
  }
];

function filterAndSortIssues(issues) {
  const automationLabels = [
    'claude-processed', 
    'claude-ready', 
    'automation-ready',
    'claude-code-ready',
    'auto-fix',
    'automate'
  ];
  
  const skipLabels = [
    'claude-completed',
    'wontfix',
    'duplicate',
    'invalid',
    'manual-only',
    'do-not-automate'
  ];
  
  // Filter and sort issues by priority
  return issues
    .filter(issue => 
      issue.labels.some(label => automationLabels.includes(label.name)) &&
      !issue.labels.some(label => skipLabels.includes(label.name))
    )
    .sort((a, b) => {
      // Sort by priority
      const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      const aPriority = a.labels.find(l => l.name.startsWith('priority:'))?.name.split(':')[1] || 'medium';
      const bPriority = b.labels.find(l => l.name.startsWith('priority:'))?.name.split(':')[1] || 'medium';
      return (priorityOrder[aPriority] || 2) - (priorityOrder[bPriority] || 2);
    });
}

console.log('📋 Original Issues:');
testIssues.forEach(issue => {
  const priority = issue.labels.find(l => l.name.startsWith('priority:'))?.name || 'no priority';
  const automationLabel = issue.labels.find(l => ['claude-ready', 'automation-ready', 'automate', 'auto-fix'].includes(l.name))?.name || 'none';
  const skipLabel = issue.labels.find(l => ['wontfix', 'manual-only'].includes(l.name))?.name || 'none';
  
  console.log(`  #${issue.number}: ${issue.title}`);
  console.log(`    Priority: ${priority}, Automation: ${automationLabel}, Skip: ${skipLabel}`);
});

console.log('\n🔍 After Filtering and Sorting:');
const filteredIssues = filterAndSortIssues(testIssues);

if (filteredIssues.length === 0) {
  console.log('  No issues passed the filter');
} else {
  filteredIssues.forEach((issue, index) => {
    const priority = issue.labels.find(l => l.name.startsWith('priority:'))?.name.split(':')[1] || 'medium';
    console.log(`  ${index + 1}. #${issue.number}: ${issue.title} (${priority} priority)`);
  });
}

console.log('\n📊 Filter Results:');
console.log(`  Original issues: ${testIssues.length}`);
console.log(`  Filtered issues: ${filteredIssues.length}`);
console.log(`  Skipped issues: ${testIssues.length - filteredIssues.length}`);

console.log('\n✅ Prioritization test completed');

// Verify priority order
const priorities = filteredIssues.map(issue => 
  issue.labels.find(l => l.name.startsWith('priority:'))?.name.split(':')[1] || 'medium'
);

console.log(`\n🎯 Priority order: ${priorities.join(' → ')}`);

const expectedOrder = ['critical', 'high', 'medium', 'low'];
const isCorrectOrder = priorities.every((priority, index) => {
  if (index === 0) return true;
  const currentIndex = expectedOrder.indexOf(priority);
  const previousIndex = expectedOrder.indexOf(priorities[index - 1]);
  return currentIndex >= previousIndex;
});

console.log(`🔍 Priority sorting: ${isCorrectOrder ? '✅ CORRECT' : '❌ INCORRECT'}`);