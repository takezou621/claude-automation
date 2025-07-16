#!/usr/bin/env node

/**
 * Monitor Claude Automation Workflow Execution
 * GitHub APIを使用してワークフローの実行状況を監視
 */

const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'takezou621';
const REPO_NAME = 'claude-automation';
const ISSUE_NUMBER = 21;

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

function makeGitHubRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Claude-Automation-Monitor'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`GitHub API Error: ${res.statusCode} - ${response.message || data}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function checkIssueStatus() {
  try {
    const issue = await makeGitHubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}`);
    
    console.log('📋 Issue Status:');
    console.log(`  • State: ${issue.state}`);
    console.log(`  • Title: ${issue.title}`);
    console.log(`  • Labels: ${issue.labels.map(l => l.name).join(', ')}`);
    console.log(`  • Comments: ${issue.comments}`);
    console.log(`  • Updated: ${new Date(issue.updated_at).toLocaleString()}`);
    
    return issue;
  } catch (error) {
    console.error(`❌ Failed to check issue status: ${error.message}`);
    return null;
  }
}

async function checkWorkflowRuns() {
  try {
    const runs = await makeGitHubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=10`);
    
    console.log('\n🚀 Recent Workflow Runs:');
    runs.workflow_runs.slice(0, 5).forEach((run, index) => {
      const status = run.status === 'completed' ? 
        (run.conclusion === 'success' ? '✅' : run.conclusion === 'failure' ? '❌' : '⚠️') : 
        '🔄';
      
      console.log(`  ${status} ${run.name}`);
      console.log(`    • Status: ${run.status} ${run.conclusion ? `(${run.conclusion})` : ''}`);
      console.log(`    • Started: ${new Date(run.created_at).toLocaleString()}`);
      console.log(`    • Branch: ${run.head_branch}`);
      if (index < 4) console.log();
    });
    
    return runs.workflow_runs;
  } catch (error) {
    console.error(`❌ Failed to check workflow runs: ${error.message}`);
    return [];
  }
}

async function checkPullRequests() {
  try {
    const prs = await makeGitHubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=all&per_page=5`);
    
    console.log('\n📤 Recent Pull Requests:');
    if (prs.length === 0) {
      console.log('  No pull requests found');
      return [];
    }
    
    prs.forEach((pr, index) => {
      const status = pr.state === 'open' ? '🔄' : pr.merged_at ? '✅' : '❌';
      console.log(`  ${status} #${pr.number}: ${pr.title}`);
      console.log(`    • State: ${pr.state}${pr.merged_at ? ' (merged)' : ''}`);
      console.log(`    • Branch: ${pr.head.ref} → ${pr.base.ref}`);
      console.log(`    • Created: ${new Date(pr.created_at).toLocaleString()}`);
      if (index < 4) console.log();
    });
    
    return prs;
  } catch (error) {
    console.error(`❌ Failed to check pull requests: ${error.message}`);
    return [];
  }
}

async function checkBranches() {
  try {
    const branches = await makeGitHubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/branches`);
    
    console.log('\n🌿 Repository Branches:');
    const automationBranches = branches.filter(b => 
      b.name.includes('claude-auto-impl') || b.name.includes('automation')
    );
    
    if (automationBranches.length === 0) {
      console.log('  No automation branches found yet');
    } else {
      automationBranches.forEach(branch => {
        console.log(`  • ${branch.name}`);
        console.log(`    Last commit: ${new Date(branch.commit.commit.author.date).toLocaleString()}`);
      });
    }
    
    return branches;
  } catch (error) {
    console.error(`❌ Failed to check branches: ${error.message}`);
    return [];
  }
}

async function checkIssueComments() {
  try {
    const comments = await makeGitHubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}/comments`);
    
    console.log('\n💬 Issue Comments:');
    if (comments.length === 0) {
      console.log('  No comments yet');
      return [];
    }
    
    comments.forEach((comment, index) => {
      console.log(`  📝 Comment ${index + 1} by ${comment.user.login}:`);
      console.log(`    • Posted: ${new Date(comment.created_at).toLocaleString()}`);
      console.log(`    • Preview: ${comment.body.substring(0, 100)}${comment.body.length > 100 ? '...' : ''}`);
      console.log();
    });
    
    return comments;
  } catch (error) {
    console.error(`❌ Failed to check comments: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('🔍 Monitoring Claude Automation Workflow...');
  console.log(`📍 Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log(`🎯 Issue: #${ISSUE_NUMBER}`);
  console.log(`⏰ Check Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));
  
  const [issue, workflowRuns, pullRequests, branches, comments] = await Promise.all([
    checkIssueStatus(),
    checkWorkflowRuns(),
    checkPullRequests(),
    checkBranches(),
    checkIssueComments()
  ]);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Automation Status Summary:');
  
  if (issue) {
    const hasAutomationLabels = issue.labels.some(l => 
      ['claude-ready', 'automation-ready', 'claude-processed'].includes(l.name)
    );
    console.log(`  ✅ Issue created and labeled: ${hasAutomationLabels ? 'Yes' : 'No'}`);
  }
  
  const recentAutomationRuns = workflowRuns.filter(run => 
    run.name.includes('Claude') && 
    new Date(run.created_at) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
  );
  console.log(`  🚀 Recent automation runs: ${recentAutomationRuns.length}`);
  
  const automationPRs = pullRequests.filter(pr => 
    pr.title.includes('Auto-implement') || pr.head.ref.includes('claude-auto-impl')
  );
  console.log(`  📤 Automation PRs: ${automationPRs.length}`);
  
  const automationBranches = branches.filter(b => b.name.includes('claude-auto-impl'));
  console.log(`  🌿 Automation branches: ${automationBranches.length}`);
  
  const botComments = comments.filter(c => 
    c.body.includes('Claude') || c.body.includes('automation')
  );
  console.log(`  💬 Bot comments: ${botComments.length}`);
  
  console.log('\n🔗 Useful Links:');
  console.log(`  • Issue: https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}`);
  console.log(`  • Actions: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`);
  console.log(`  • PRs: https://github.com/${REPO_OWNER}/${REPO_NAME}/pulls`);
  
  console.log('\n⏱️  Workflow Timing:');
  console.log('  • Issue triggers: Immediate');
  console.log('  • Scheduled runs: 23:00, 02:00, 05:00 JST (weekdays)');
  console.log('  • Next scheduled: Today 23:00 JST');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  checkIssueStatus, 
  checkWorkflowRuns, 
  checkPullRequests, 
  checkBranches,
  checkIssueComments 
};