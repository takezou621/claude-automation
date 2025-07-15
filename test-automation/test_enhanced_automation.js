const fs = require('fs');

// Test enhanced automation with various issue types
const testIssues = [
  {
    number: 10,
    title: 'Fix login authentication bug',
    body: 'Users cannot login with valid credentials',
    labels: [{ name: 'bug' }, { name: 'priority:high' }]
  },
  {
    number: 11, 
    title: 'Add new user dashboard feature',
    body: 'Create a dashboard for user metrics and analytics',
    labels: [{ name: 'feature' }, { name: 'enhancement' }]
  },
  {
    number: 12,
    title: 'Security vulnerability in API endpoint', 
    body: 'SQL injection possible in user search endpoint',
    labels: [{ name: 'security' }, { name: 'critical' }]
  },
  {
    number: 13,
    title: 'Add unit tests for payment module',
    body: 'Need comprehensive test coverage for payment processing',
    labels: [{ name: 'test' }, { name: 'testing' }]
  },
  {
    number: 14,
    title: 'Update API documentation',
    body: 'API docs are outdated and missing new endpoints',
    labels: [{ name: 'documentation' }, { name: 'docs' }]
  }
];

// Simulate the enhanced analyzeIssue function
function analyzeIssue(issue) {
  const title = issue.title.toLowerCase();
  const body = (issue.body || '').toLowerCase();
  const labels = issue.labels.map(label => label.name.toLowerCase());
  
  let type = 'general';
  let priority = 'medium';
  let complexity = 'simple';
  let tags = [];
  
  // Enhanced keyword detection
  const bugfixKeywords = ['fix', 'bug', 'error', 'issue', 'problem', 'broken'];
  const featureKeywords = ['feature', 'add', 'new', 'implement', 'create', 'enhancement'];
  const securityKeywords = ['security', 'vulnerability', 'cve', 'exploit', 'injection'];
  const testKeywords = ['test', 'spec', 'unit', 'integration', 'testing'];
  const docKeywords = ['doc', 'readme', 'documentation', 'guide', 'manual'];
  
  // Type detection
  if (securityKeywords.some(keyword => title.includes(keyword) || body.includes(keyword) || labels.includes(keyword))) {
    type = 'security';
    priority = 'critical';
    tags.push('security');
  } else if (bugfixKeywords.some(keyword => title.includes(keyword) || body.includes(keyword) || labels.includes(keyword))) {
    type = 'bugfix';
  } else if (featureKeywords.some(keyword => title.includes(keyword) || body.includes(keyword))) {
    type = 'feature';
  } else if (testKeywords.some(keyword => title.includes(keyword) || body.includes(keyword))) {
    type = 'test';
  } else if (docKeywords.some(keyword => title.includes(keyword) || body.includes(keyword))) {
    type = 'documentation';
  }
  
  // Priority detection
  if (labels.includes('priority:critical') || labels.includes('critical')) {
    priority = 'critical';
  } else if (labels.includes('priority:high') || labels.includes('urgent')) {
    priority = 'high';
  } else if (labels.includes('priority:low') || labels.includes('enhancement')) {
    priority = 'low';
  }
  
  return { type, priority, complexity, tags };
}

console.log('🧪 Testing Enhanced Issue Automation\n');

// Test each issue type
testIssues.forEach(issue => {
  const analysis = analyzeIssue(issue);
  console.log(`Issue #${issue.number}: ${issue.title}`);
  console.log(`  Type: ${analysis.type}`);
  console.log(`  Priority: ${analysis.priority}`);
  console.log(`  Complexity: ${analysis.complexity}`);
  if (analysis.tags.length > 0) {
    console.log(`  Tags: ${analysis.tags.join(', ')}`);
  }
  console.log('');
});

console.log('✅ Enhanced automation test completed');
console.log('📊 Issue type distribution:');

const typeCount = {};
testIssues.forEach(issue => {
  const type = analyzeIssue(issue).type;
  typeCount[type] = (typeCount[type] || 0) + 1;
});

Object.entries(typeCount).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} issue(s)`);
});