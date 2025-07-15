/**
 * Intelligent Code Analyzer
 * AI-powered code analysis system using Claude API
 */

const ClaudeAPIClient = require('./claude-api-client');
const fs = require('fs').promises;
const path = require('path');

class IntelligentCodeAnalyzer {
  constructor(apiKey, options = {}) {
    this.claude = new ClaudeAPIClient(apiKey, options);
    this.analysisCache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
    this.supportedLanguages = [
      'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 
      'php', 'ruby', 'swift', 'kotlin', 'scala', 'dart', 'yaml', 'json'
    ];
  }

  /**
   * Analyze code changes in a pull request
   */
  async analyzePullRequest(prData, options = {}) {
    const startTime = Date.now();
    const analysisId = `pr-${prData.number}-${Date.now()}`;
    
    console.log(`🔍 Starting intelligent analysis for PR #${prData.number}`);
    
    try {
      // Pre-analysis validation
      const validationResult = await this.validatePullRequest(prData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error,
          analysisId,
          executionTime: Date.now() - startTime
        };
      }

      // File-by-file analysis
      const fileAnalyses = [];
      const securityIssues = [];
      const performanceIssues = [];
      const qualityIssues = [];
      
      for (const file of prData.files) {
        if (this.shouldAnalyzeFile(file.filename)) {
          console.log(`📄 Analyzing file: ${file.filename}`);
          
          const fileAnalysis = await this.analyzeFile(file, {
            context: {
              prTitle: prData.title,
              prDescription: prData.description,
              totalFiles: prData.files.length
            },
            ...options
          });
          
          fileAnalyses.push(fileAnalysis);
          
          // Categorize issues
          if (fileAnalysis.security) {
            securityIssues.push(...fileAnalysis.security);
          }
          if (fileAnalysis.performance) {
            performanceIssues.push(...fileAnalysis.performance);
          }
          if (fileAnalysis.quality) {
            qualityIssues.push(...fileAnalysis.quality);
          }
        }
      }

      // Overall PR analysis
      const overallAnalysis = await this.analyzeOverallPR(prData, fileAnalyses, options);
      
      // Generate risk assessment
      const riskAssessment = this.calculateRiskAssessment(fileAnalyses, securityIssues, performanceIssues);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(fileAnalyses, riskAssessment);
      
      const result = {
        success: true,
        analysisId,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        pullRequest: {
          number: prData.number,
          title: prData.title,
          filesChanged: prData.files.length,
          additions: prData.additions,
          deletions: prData.deletions
        },
        analysis: {
          overall: overallAnalysis,
          files: fileAnalyses,
          riskAssessment,
          recommendations,
          issues: {
            security: securityIssues,
            performance: performanceIssues,
            quality: qualityIssues
          }
        },
        metadata: {
          aiModel: this.claude.model,
          analysisVersion: '1.0.0',
          processingTime: Date.now() - startTime
        }
      };

      // Cache the result
      this.cacheResult(analysisId, result);
      
      return result;

    } catch (error) {
      console.error(`❌ Analysis failed for PR #${prData.number}:`, error);
      return {
        success: false,
        error: error.message,
        analysisId,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze individual file
   */
  async analyzeFile(file, options = {}) {
    const language = this.detectLanguage(file.filename);
    const complexity = this.calculateComplexity(file);
    
    // Check cache first
    const cacheKey = `file-${file.filename}-${this.hashContent(file.patch)}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log(`📋 Using cached analysis for ${file.filename}`);
      return cached;
    }

    const analysisPrompt = this.buildFileAnalysisPrompt(file, language, complexity, options);
    
    const claudeResult = await this.claude.analyzeCode(file.patch, 'general', {
      systemPrompt: analysisPrompt.systemPrompt,
      maxTokens: 2000,
      temperature: 0.1
    });

    if (!claudeResult.success) {
      return {
        filename: file.filename,
        success: false,
        error: claudeResult.error
      };
    }

    // Parse Claude's response
    const analysis = this.parseClaudeAnalysis(claudeResult.response);
    
    const result = {
      filename: file.filename,
      language,
      complexity,
      changes: {
        additions: file.additions,
        deletions: file.deletions,
        modifications: file.changes
      },
      analysis: {
        summary: analysis.summary,
        riskLevel: analysis.riskLevel,
        issues: analysis.issues,
        suggestions: analysis.suggestions,
        security: analysis.security,
        performance: analysis.performance,
        quality: analysis.quality
      },
      aiResponse: {
        model: claudeResult.model,
        usage: claudeResult.usage,
        executionTime: claudeResult.executionTime
      }
    };

    // Cache the result
    this.cacheResult(cacheKey, result);
    
    return result;
  }

  /**
   * Analyze overall PR impact
   */
  async analyzeOverallPR(prData, fileAnalyses, options = {}) {
    const overallPrompt = `Analyze this pull request holistically:

**PR Title:** ${prData.title}
**Description:** ${prData.description}
**Files Changed:** ${prData.files.length}
**Total Changes:** +${prData.additions} -${prData.deletions}

**File Analysis Summary:**
${fileAnalyses.map(fa => `
- ${fa.filename}: ${fa.analysis ? fa.analysis.riskLevel : 'Unknown'} risk
  Issues: ${fa.analysis ? fa.analysis.issues.length : 0}
  Suggestions: ${fa.analysis ? fa.analysis.suggestions.length : 0}
`).join('')}

Please provide:
1. Overall assessment of the PR
2. Impact on system architecture
3. Integration risks
4. Deployment considerations
5. Testing recommendations
6. Final recommendation (APPROVE/REQUEST_CHANGES/COMMENT)`;

    const result = await this.claude.sendMessage(overallPrompt, {
      systemPrompt: 'You are a senior technical lead reviewing the overall impact of a pull request on the system.',
      maxTokens: 1500,
      temperature: 0.1
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    return {
      success: true,
      assessment: result.response,
      executionTime: result.executionTime
    };
  }

  /**
   * Calculate risk assessment
   */
  calculateRiskAssessment(fileAnalyses, securityIssues, performanceIssues) {
    let riskScore = 0;
    let riskLevel = 'LOW';
    
    // File-based risk calculation
    for (const analysis of fileAnalyses) {
      if (analysis.analysis) {
        switch (analysis.analysis.riskLevel) {
          case 'HIGH': riskScore += 10; break;
          case 'MEDIUM': riskScore += 5; break;
          case 'LOW': riskScore += 1; break;
        }
        
        // Additional risk for issues
        riskScore += analysis.analysis.issues.length * 2;
      }
    }
    
    // Security and performance risk
    riskScore += securityIssues.length * 8;
    riskScore += performanceIssues.length * 4;
    
    // Determine overall risk level
    if (riskScore >= 30) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 15) {
      riskLevel = 'MEDIUM';
    }
    
    return {
      score: riskScore,
      level: riskLevel,
      factors: {
        fileComplexity: fileAnalyses.length,
        securityIssues: securityIssues.length,
        performanceIssues: performanceIssues.length,
        codeQualityIssues: fileAnalyses.reduce((acc, fa) => acc + (fa.analysis ? fa.analysis.issues.length : 0), 0)
      },
      recommendation: this.getRiskRecommendation(riskLevel)
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(fileAnalyses, riskAssessment) {
    const recommendations = [];
    
    // Risk-based recommendations
    if (riskAssessment.level === 'HIGH') {
      recommendations.push({
        type: 'CRITICAL',
        title: 'High Risk Changes Detected',
        description: 'This PR contains high-risk changes that require careful review and testing.',
        actions: [
          'Conduct thorough manual code review',
          'Implement comprehensive testing',
          'Consider breaking changes into smaller PRs',
          'Review security implications'
        ]
      });
    }
    
    // Security recommendations
    if (riskAssessment.factors.securityIssues > 0) {
      recommendations.push({
        type: 'SECURITY',
        title: 'Security Issues Found',
        description: `${riskAssessment.factors.securityIssues} security issues detected.`,
        actions: [
          'Review security vulnerabilities',
          'Implement security best practices',
          'Consider security testing',
          'Update dependencies if needed'
        ]
      });
    }
    
    // Performance recommendations
    if (riskAssessment.factors.performanceIssues > 0) {
      recommendations.push({
        type: 'PERFORMANCE',
        title: 'Performance Concerns',
        description: `${riskAssessment.factors.performanceIssues} performance issues detected.`,
        actions: [
          'Review performance implications',
          'Consider performance testing',
          'Optimize critical paths',
          'Monitor resource usage'
        ]
      });
    }
    
    // Quality recommendations
    const qualityIssues = fileAnalyses.reduce((acc, fa) => acc + (fa.analysis ? fa.analysis.issues.length : 0), 0);
    if (qualityIssues > 5) {
      recommendations.push({
        type: 'QUALITY',
        title: 'Code Quality Improvements',
        description: `${qualityIssues} code quality issues detected.`,
        actions: [
          'Address code quality issues',
          'Improve documentation',
          'Add missing tests',
          'Follow coding standards'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  
  validatePullRequest(prData) {
    if (!prData.files || prData.files.length === 0) {
      return { valid: false, error: 'No files to analyze' };
    }
    
    if (prData.files.length > 50) {
      return { valid: false, error: 'Too many files to analyze efficiently' };
    }
    
    return { valid: true };
  }

  shouldAnalyzeFile(filename) {
    // Skip non-code files
    const skipExtensions = ['.md', '.txt', '.png', '.jpg', '.gif', '.pdf', '.zip'];
    const skipPatterns = ['/node_modules/', '/vendor/', '/.git/', '/dist/', '/build/'];
    
    const ext = path.extname(filename).toLowerCase();
    if (skipExtensions.includes(ext)) return false;
    
    return !skipPatterns.some(pattern => filename.includes(pattern));
  }

  detectLanguage(filename) {
    const ext = path.extname(filename).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.dart': 'dart',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.json': 'json'
    };
    
    return languageMap[ext] || 'unknown';
  }

  calculateComplexity(file) {
    if (!file.patch) return 'LOW';
    
    const lines = file.patch.split('\n');
    const addedLines = lines.filter(line => line.startsWith('+')).length;
    const deletedLines = lines.filter(line => line.startsWith('-')).length;
    const totalChanges = addedLines + deletedLines;
    
    if (totalChanges > 100) return 'HIGH';
    if (totalChanges > 50) return 'MEDIUM';
    return 'LOW';
  }

  buildFileAnalysisPrompt(file, language, complexity, options) {
    return {
      systemPrompt: `You are an expert code reviewer analyzing ${language} code. 
      
      Focus on:
      - Code quality and best practices
      - Security vulnerabilities
      - Performance implications
      - Maintainability issues
      - Potential bugs
      
      Provide structured feedback with specific, actionable recommendations.`
    };
  }

  parseClaudeAnalysis(response) {
    // Parse structured response from Claude
    // This is a simplified parser - in production, you'd want more robust parsing
    
    const sections = response.split('\n\n');
    
    return {
      summary: sections[0] || 'No summary available',
      riskLevel: this.extractRiskLevel(response),
      issues: this.extractIssues(response),
      suggestions: this.extractSuggestions(response),
      security: this.extractSecurityIssues(response),
      performance: this.extractPerformanceIssues(response),
      quality: this.extractQualityIssues(response)
    };
  }

  extractRiskLevel(response) {
    const riskRegex = /risk.*?level.*?:?\s*(high|medium|low)/i;
    const match = response.match(riskRegex);
    return match ? match[1].toUpperCase() : 'MEDIUM';
  }

  extractIssues(response) {
    // Extract issues from response
    const issueRegex = /(?:issue|problem|concern).*?:?\s*(.+?)(?:\n|$)/gi;
    const issues = [];
    let match;
    
    while ((match = issueRegex.exec(response)) !== null) {
      issues.push(match[1].trim());
    }
    
    return issues;
  }

  extractSuggestions(response) {
    const suggestionRegex = /(?:suggest|recommend|should).*?:?\s*(.+?)(?:\n|$)/gi;
    const suggestions = [];
    let match;
    
    while ((match = suggestionRegex.exec(response)) !== null) {
      suggestions.push(match[1].trim());
    }
    
    return suggestions;
  }

  extractSecurityIssues(response) {
    const securityRegex = /(?:security|vulnerability|exploit).*?:?\s*(.+?)(?:\n|$)/gi;
    const issues = [];
    let match;
    
    while ((match = securityRegex.exec(response)) !== null) {
      issues.push(match[1].trim());
    }
    
    return issues;
  }

  extractPerformanceIssues(response) {
    const performanceRegex = /(?:performance|slow|inefficient|optimization).*?:?\s*(.+?)(?:\n|$)/gi;
    const issues = [];
    let match;
    
    while ((match = performanceRegex.exec(response)) !== null) {
      issues.push(match[1].trim());
    }
    
    return issues;
  }

  extractQualityIssues(response) {
    const qualityRegex = /(?:quality|maintainability|readability|documentation).*?:?\s*(.+?)(?:\n|$)/gi;
    const issues = [];
    let match;
    
    while ((match = qualityRegex.exec(response)) !== null) {
      issues.push(match[1].trim());
    }
    
    return issues;
  }

  getRiskRecommendation(riskLevel) {
    switch (riskLevel) {
      case 'HIGH':
        return 'Manual review required. Consider breaking into smaller changes.';
      case 'MEDIUM':
        return 'Careful review recommended. Ensure adequate testing.';
      case 'LOW':
        return 'Standard review process. Can proceed with automation.';
      default:
        return 'Review recommended.';
    }
  }

  hashContent(content) {
    // Simple hash function for caching
    let hash = 0;
    if (!content) return hash;
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  }

  cacheResult(key, result) {
    this.analysisCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  getCachedResult(key) {
    const cached = this.analysisCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.result;
    }
    
    this.analysisCache.delete(key);
    return null;
  }

  /**
   * Get analysis statistics
   */
  getAnalysisStats() {
    return {
      cacheSize: this.analysisCache.size,
      supportedLanguages: this.supportedLanguages.length,
      apiStats: this.claude.getUsageStats()
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
  }
}

module.exports = IntelligentCodeAnalyzer;