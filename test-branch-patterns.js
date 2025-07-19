#!/usr/bin/env node

/**
 * Test script for enhanced BranchPatternManager
 * Tests the new issue-based patterns and improved interface
 */

const BranchPatternManager = require('./src/branch-pattern-manager.js');

function runTests() {
  console.log('🧪 Testing Enhanced BranchPatternManager\n');
  
  const manager = new BranchPatternManager();
  
  // Test 1: Issue-based pattern selection
  console.log('Test 1: Issue-based pattern selection');
  const testIssue = {
    number: 123,
    title: 'Fix security vulnerability in authentication',
    labels: [
      { name: 'security' },
      { name: 'priority:high' }
    ],
    body: 'This is a security issue that needs immediate attention'
  };
  
  const selection = manager.selectPattern(testIssue, { preferSecurity: true });
  console.log('Selected pattern:', selection);
  
  // Test 2: Branch name generation with issue numbers
  console.log('\nTest 2: Branch name generation with issue numbers');
  const branchInfo = manager.generateBranchName(selection.pattern, testIssue);
  console.log('Generated branch info:', branchInfo);
  
  // Test 3: Test all required patterns from implementation report
  console.log('\nTest 3: Testing all required patterns');
  const requiredPatterns = [
    'issue-basic',      // issue-{number}
    'claude-basic',     // claude-{number}
    'issue-feature',    // feature/issue-{number}
    'issue-fix',        // fix/issue-{number}
    'issue-hotfix',     // hotfix/issue-{number}
    'issue-claude',     // claude/issue-{number}
    'automation-basic', // automation-{number}
    'issue-security',   // security/issue-{number}
    'issue-enhancement' // enhancement/issue-{number}
  ];
  
  requiredPatterns.forEach(pattern => {
    try {
      const result = manager.generateBranchName(pattern, testIssue);
      console.log(`✅ ${pattern}: ${result.name}`);
    } catch (error) {
      console.log(`❌ ${pattern}: ${error.message}`);
    }
  });
  
  // Test 4: Different issue types
  console.log('\nTest 4: Different issue types');
  const testCases = [
    { title: 'Add new feature for user dashboard', labels: [{ name: 'feature' }] },
    { title: 'Fix bug in payment processing', labels: [{ name: 'bug' }] },
    { title: 'Update documentation for API', labels: [{ name: 'documentation' }] },
    { title: 'Urgent hotfix for production', labels: [{ name: 'hotfix' }, { name: 'priority:critical' }] }
  ];
  
  testCases.forEach((testCase, index) => {
    const issue = { number: index + 1, ...testCase };
    const selection = manager.selectPattern(issue);
    const branchInfo = manager.generateBranchName(selection.pattern, issue);
    console.log(`Issue ${index + 1}: "${testCase.title}" → ${branchInfo.name}`);
  });
  
  // Test 5: Pattern validation
  console.log('\nTest 5: Pattern validation');
  const testBranches = [
    'security/issue-123',
    'feature/issue-456',
    'claude-789',
    'automation-101',
    'invalid//branch--name',
    'toolongbranchname'.repeat(10)
  ];
  
  testBranches.forEach(branch => {
    const validation = manager.validateBranchName(branch);
    console.log(`${branch}: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    if (!validation.isValid) {
      console.log(`  Errors: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`  Warnings: ${validation.warnings.join(', ')}`);
    }
  });
  
  // Test 6: Pattern detection
  console.log('\nTest 6: Pattern detection');
  const existingBranches = [
    'security/issue-123',
    'feature/issue-456',
    'claude-789',
    'automation-101',
    'fix/issue-999'
  ];
  
  existingBranches.forEach(branch => {
    const detection = manager.detectPattern(branch);
    console.log(`${branch}: ${detection.matches ? '✅' : '❌'} Pattern: ${detection.pattern} (${Math.round(detection.confidence * 100)}% confidence)`);
  });
  
  // Test 7: Pattern recommendations
  console.log('\nTest 7: Pattern recommendations');
  const recommendations = manager.getPatternRecommendations(existingBranches, { preferIssuePatterns: true });
  console.log('Recommendations:', recommendations);
  
  console.log('\n🎉 All tests completed!');
}

// Run tests
runTests();