#!/usr/bin/env node

/**
 * RepairGPT Enhancements Test Suite
 * Tests the enhanced features inspired by RepairGPT workflow analysis
 */

const fs = require('fs');
const yaml = require('js-yaml');

console.log('🧪 RepairGPT Enhancements Test Suite Starting...\n');

// Test 1: Enhanced Security Patterns
function testSecurityPatterns() {
    console.log('📋 Test 1: Enhanced Security Patterns');
    
    const workflowContent = fs.readFileSync('.github/workflows/claude-code-automation.yml', 'utf8');
    const workflow = yaml.load(workflowContent);
    
    // Extract security patterns from the workflow
    const scriptContent = workflow.jobs['claude-code-automation'].steps.find(
        step => step.name === 'Claude Code Full Automation Engine'
    ).with.script;
    
    const expectedPatterns = [
        'eval\\\\\\\\(',
        'exec\\\\\\\\(',
        'os\\\\\\\\.system',
        'shell=True',
        'input\\\\\\\\(',
        'getattr\\\\\\\\(',
        'setattr\\\\\\\\('
    ];
    
    let foundPatterns = 0;
    expectedPatterns.forEach(pattern => {
        if (scriptContent.includes(pattern)) {
            foundPatterns++;
            console.log(`  ✅ Found security pattern: ${pattern}`);
        } else {
            console.log(`  ❌ Missing security pattern: ${pattern}`);
        }
    });
    
    console.log(`  📊 Security Patterns: ${foundPatterns}/${expectedPatterns.length} found`);
    console.log(`  ${foundPatterns === expectedPatterns.length ? '✅' : '❌'} Security patterns test\n`);
    
    return foundPatterns === expectedPatterns.length;
}

// Test 2: Enhanced Label System
function testLabelSystem() {
    console.log('📋 Test 2: Enhanced Label System');
    
    const workflowContent = fs.readFileSync('.github/workflows/claude-code-automation.yml', 'utf8');
    
    const repairGPTLabels = [
        'rapid-process',
        'claude-issue-processor',
        'claude-full-automation',
        'priority:high',
        'priority:critical',
        'urgent',
        'hotfix'
    ];
    
    let foundLabels = 0;
    repairGPTLabels.forEach(label => {
        if (workflowContent.includes(`'${label}'`)) {
            foundLabels++;
            console.log(`  ✅ Found RepairGPT label: ${label}`);
        } else {
            console.log(`  ❌ Missing RepairGPT label: ${label}`);
        }
    });
    
    console.log(`  📊 RepairGPT Labels: ${foundLabels}/${repairGPTLabels.length} found`);
    console.log(`  ${foundLabels === repairGPTLabels.length ? '✅' : '❌'} Label system test\n`);
    
    return foundLabels === repairGPTLabels.length;
}

// Test 3: Quality Review Enhancement
function testQualityReview() {
    console.log('📋 Test 3: Enhanced Quality Review System');
    
    const workflowContent = fs.readFileSync('.github/workflows/claude-code-automation.yml', 'utf8');
    
    const qualityChecks = [
        'hasValidCode',
        'hasProperStructure',
        'hasErrorHandling',
        'isSecure',
        'hasAdequateImplementation',
        'followsNamingConventions',
        'hasRequiredImports',
        'noSecretLeakage'
    ];
    
    let foundChecks = 0;
    qualityChecks.forEach(check => {
        if (workflowContent.includes(check)) {
            foundChecks++;
            console.log(`  ✅ Found quality check: ${check}`);
        } else {
            console.log(`  ❌ Missing quality check: ${check}`);
        }
    });
    
    console.log(`  📊 Quality Checks: ${foundChecks}/${qualityChecks.length} found`);
    console.log(`  ${foundChecks === qualityChecks.length ? '✅' : '❌'} Quality review test\n`);
    
    return foundChecks === qualityChecks.length;
}

// Test 4: workflow_run Triggers
function testWorkflowRunTriggers() {
    console.log('📋 Test 4: workflow_run Triggers');
    
    const workflowContent = fs.readFileSync('.github/workflows/claude-code-automation.yml', 'utf8');
    const workflow = yaml.load(workflowContent);
    
    const hasWorkflowRun = workflow.on && workflow.on.workflow_run;
    const correctWorkflow = hasWorkflowRun && 
        workflow.on.workflow_run.workflows.includes('Claude Issue Processor');
    
    console.log(`  ${hasWorkflowRun ? '✅' : '❌'} workflow_run trigger present`);
    console.log(`  ${correctWorkflow ? '✅' : '❌'} Claude Issue Processor workflow reference`);
    
    const success = hasWorkflowRun && correctWorkflow;
    console.log(`  ${success ? '✅' : '❌'} workflow_run triggers test\n`);
    
    return success;
}

// Test 5: Issue Processor File
function testIssueProcessor() {
    console.log('📋 Test 5: Claude Issue Processor');
    
    const issueProcessorExists = fs.existsSync('.github/workflows/claude-issue-processor.yml');
    console.log(`  ${issueProcessorExists ? '✅' : '❌'} Issue processor file exists`);
    
    if (issueProcessorExists) {
        try {
            const content = fs.readFileSync('.github/workflows/claude-issue-processor.yml', 'utf8');
            const workflow = yaml.load(content);
            
            const hasSchedule = workflow.on && workflow.on.schedule;
            const hasIssueAnalysis = content.includes('analyzeIssueForAutomation');
            const hasAutoAssignment = content.includes('autoAssignReviewers');
            const hasStalenessCheck = content.includes('checkAndHandleStaleness');
            
            console.log(`  ${hasSchedule ? '✅' : '❌'} Scheduled execution`);
            console.log(`  ${hasIssueAnalysis ? '✅' : '❌'} Issue analysis function`);
            console.log(`  ${hasAutoAssignment ? '✅' : '❌'} Auto-assignment function`);
            console.log(`  ${hasStalenessCheck ? '✅' : '❌'} Staleness check function`);
            
            const success = hasSchedule && hasIssueAnalysis && hasAutoAssignment && hasStalenessCheck;
            console.log(`  ${success ? '✅' : '❌'} Issue processor test\n`);
            
            return success;
        } catch (error) {
            console.log(`  ❌ Error parsing issue processor: ${error.message}\n`);
            return false;
        }
    }
    
    return false;
}

// Test 6: RepairGPT Scheduling
function testRepairGPTScheduling() {
    console.log('📋 Test 6: RepairGPT Intelligent Scheduling');
    
    const workflowContent = fs.readFileSync('.github/workflows/claude-code-automation.yml', 'utf8');
    const workflow = yaml.load(workflowContent);
    
    const schedules = workflow.on.schedule || [];
    const hasWeekdaySchedule = schedules.some(s => s.cron.includes('1-5'));
    const hasWeekendSchedule = schedules.some(s => s.cron.includes('0,6'));
    
    console.log(`  ${hasWeekdaySchedule ? '✅' : '❌'} Weekday intelligent scheduling`);
    console.log(`  ${hasWeekendSchedule ? '✅' : '❌'} Weekend intelligent scheduling`);
    
    const success = hasWeekdaySchedule && hasWeekendSchedule;
    console.log(`  ${success ? '✅' : '❌'} RepairGPT scheduling test\n`);
    
    return success;
}

// Run all tests
async function runTests() {
    const tests = [
        { name: 'Security Patterns', fn: testSecurityPatterns },
        { name: 'Label System', fn: testLabelSystem },
        { name: 'Quality Review', fn: testQualityReview },
        { name: 'workflow_run Triggers', fn: testWorkflowRunTriggers },
        { name: 'Issue Processor', fn: testIssueProcessor },
        { name: 'RepairGPT Scheduling', fn: testRepairGPTScheduling }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = test.fn();
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.log(`❌ Test '${test.name}' failed with error: ${error.message}\n`);
            results.push({ name: test.name, passed: false });
        }
    }
    
    // Summary
    console.log('=' .repeat(60));
    console.log('🏁 TEST SUMMARY - RepairGPT Enhancements');
    console.log('=' .repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
    });
    
    console.log(`\n📊 Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All RepairGPT enhancements successfully implemented!');
        console.log('🚀 The automation system now matches RepairGPT\'s sophistication level');
    } else {
        console.log('⚠️  Some enhancements need attention');
        console.log('🔧 Review the failed tests above for implementation details');
    }
    
    console.log('\n🤖 RepairGPT Enhancement Test Suite Complete');
    
    return passed === total;
}

// Execute tests
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests };