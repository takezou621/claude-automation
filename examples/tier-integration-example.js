/**
 * Automation Tier Integration Example
 * 
 * Demonstrates how to use the integrated automation tier system
 * with ConfigManager for comprehensive issue automation.
 */

const AutomationTierOrchestrator = require('../src/automation-tier-orchestrator');

async function runTierIntegrationExample() {
  console.log('🚀 Starting Automation Tier Integration Example\n');

  try {
    // Initialize the orchestrator with ConfigManager integration
    const orchestrator = new AutomationTierOrchestrator();
    await orchestrator.initialize();

    // Example issue data
    const exampleIssues = [
      {
        number: 123,
        title: 'Critical security vulnerability in authentication',
        labels: [{ name: 'security' }, { name: 'critical' }],
        body: 'Found a critical security issue that needs immediate attention'
      },
      {
        number: 124,
        title: 'Add user dashboard feature',
        labels: [{ name: 'feature' }, { name: 'enhancement' }],
        body: 'Need to implement a new user dashboard with analytics'
      },
      {
        number: 125,
        title: 'Fix typo in documentation',
        labels: [{ name: 'docs' }, { name: 'bug' }],
        body: 'Simple typo fix needed in README'
      }
    ];

    // Get system status
    console.log('📊 System Status:');
    const status = await orchestrator.getSystemStatus();
    console.log(`- Enabled tiers: ${status.enabledTiers.join(', ')}`);
    console.log(`- Configuration valid: ${status.configSummary.validation.valid}`);
    console.log('');

    // Process each issue with optimal tier selection
    for (const issue of exampleIssues) {
      console.log(`\n🎯 Processing Issue #${issue.number}: "${issue.title}"`);
      console.log('─'.repeat(60));

      try {
        const result = await orchestrator.executeAutomationForIssue(issue);
        
        console.log(`✅ Success! Executed with ${result.tier} tier`);
        console.log(`   Branch: ${result.branch.name}`);
        console.log(`   Execution time: ${result.performance.executionTime}ms`);
        console.log(`   Tier confidence: ${(result.recommendation.confidence * 100).toFixed(1)}%`);
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
    }

    // Get tier recommendations for repository
    console.log('\n📈 Tier Recommendations:');
    console.log('─'.repeat(40));
    const recommendations = await orchestrator.getTierRecommendations(exampleIssues);
    
    recommendations.recommendations.forEach(rec => {
      console.log(`Issue #${rec.issue}: ${rec.recommendedTier} tier (${(rec.confidence * 100).toFixed(1)}%)`);
      console.log(`  Reason: ${rec.reasoning}`);
    });

    // Show pattern recommendations
    console.log('\n🌿 Branch Pattern Analysis:');
    console.log('─'.repeat(30));
    console.log(`Most used pattern: ${recommendations.patterns.mostUsed[0]?.pattern || 'N/A'}`);
    console.log(`Recommended pattern: ${recommendations.patterns.recommended}`);

    // Demonstrate configuration updates
    console.log('\n⚙️ Configuration Management:');
    console.log('─'.repeat(35));
    
    // Update a tier configuration
    await orchestrator.updateTierConfiguration('rapid', {
      enabled: true,
      maxExecutionTime: 300000, // 5 minutes
      priority: 85
    });
    console.log('Updated rapid tier configuration');

    // Final system status
    const finalStatus = await orchestrator.getSystemStatus();
    console.log('\n📊 Final System Performance:');
    console.log('─'.repeat(35));
    
    Object.entries(finalStatus.tierPerformance).forEach(([tier, perf]) => {
      console.log(`${tier.toUpperCase()} Tier:`);
      console.log(`  Executions: ${perf.executionCount}`);
      console.log(`  Success rate: ${perf.successRate.toFixed(1)}%`);
      console.log(`  Avg execution time: ${perf.averageExecutionTime.toFixed(0)}ms`);
    });

    // Shutdown gracefully
    await orchestrator.shutdown();
    
    console.log('\n✅ Tier Integration Example completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    console.error(error.stack);
  }
}

// Export for use in other scripts
module.exports = { runTierIntegrationExample };

// Run if called directly
if (require.main === module) {
  runTierIntegrationExample();
}