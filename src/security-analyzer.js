/**
 * AI-Powered Security Analyzer
 * Advanced security analysis using Claude AI for vulnerability detection
 */

const ClaudeAPIClient = require('./claude-api-client');
const ConfigManager = require('./config-manager');
const crypto = require('crypto');

class SecurityAnalyzer {
  constructor(apiKey, options = {}) {
    this.claude = new ClaudeAPIClient(apiKey, options);
    this.config = new ConfigManager();
    this.vulnerabilityDatabase = new Map();
    this.securityPatterns = this.initializeSecurityPatterns();
    this.riskLevels = {
      CRITICAL: 10,
      HIGH: 8,
      MEDIUM: 5,
      LOW: 2,
      INFO: 1
    };
  }

  /**
   * Analyze code for security vulnerabilities
   */
  async analyzeCode(code, context = {}) {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();
    
    console.log(`🔍 Starting security analysis: ${analysisId}`);
    
    try {
      // Pre-analysis security checks
      const preAnalysis = await this.performPreAnalysis(code, context);
      
      // AI-powered deep security analysis
      const aiAnalysis = await this.performAISecurityAnalysis(code, context, preAnalysis);
      
      // Pattern-based vulnerability detection
      const patternAnalysis = await this.performPatternAnalysis(code, context);
      
      // Dependency security analysis
      const dependencyAnalysis = await this.analyzeDependencies(code, context);
      
      // Combine all analysis results
      const combinedResults = this.combineAnalysisResults({
        preAnalysis,
        aiAnalysis,
        patternAnalysis,
        dependencyAnalysis
      });
      
      // Generate security report
      const securityReport = await this.generateSecurityReport(combinedResults, context);
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(combinedResults);
      
      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations(combinedResults, riskScore);
      
      const result = {
        success: true,
        analysisId,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        context,
        analysis: {
          riskScore,
          riskLevel: this.getRiskLevel(riskScore),
          vulnerabilities: combinedResults.vulnerabilities,
          warnings: combinedResults.warnings,
          recommendations,
          report: securityReport
        },
        details: {
          preAnalysis,
          aiAnalysis,
          patternAnalysis,
          dependencyAnalysis
        },
        metadata: {
          analyzer: 'claude-security-analyzer',
          version: '1.0.0',
          aiModel: this.claude.model
        }
      };
      
      // Record learning data
      await this.recordSecurityLearning(result);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Security analysis failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        analysisId,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Pre-analysis security checks
   */
  async performPreAnalysis(code, context) {
    const findings = [];
    
    // Check for obvious secrets
    const secretPatterns = [
      /password\s*[:=]\s*['"'][^'"]{8,}['"]/gi,
      /api[_-]?key\s*[:=]\s*['"'][^'"]{16,}['"]/gi,
      /secret\s*[:=]\s*['"'][^'"]{16,}['"]/gi,
      /token\s*[:=]\s*['"'][^'"]{20,}['"]/gi,
      /private[_-]?key\s*[:=]\s*['"'][^'"]{32,}['"]/gi,
      /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi
    ];
    
    for (const pattern of secretPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        findings.push({
          type: 'SECRET_EXPOSURE',
          severity: 'CRITICAL',
          message: 'Potential secret or credential found in code',
          matches: matches.length,
          recommendation: 'Remove hardcoded secrets and use environment variables'
        });
      }
    }
    
    // Check for dangerous functions
    const dangerousFunctions = [
      { pattern: /eval\s*\(/gi, severity: 'HIGH', message: 'Use of eval() function' },
      { pattern: /document\.write\s*\(/gi, severity: 'MEDIUM', message: 'Use of document.write()' },
      { pattern: /innerHTML\s*=/gi, severity: 'MEDIUM', message: 'Direct innerHTML assignment' },
      { pattern: /exec\s*\(/gi, severity: 'HIGH', message: 'Use of exec() function' },
      { pattern: /system\s*\(/gi, severity: 'HIGH', message: 'Use of system() function' },
      { pattern: /shell_exec\s*\(/gi, severity: 'HIGH', message: 'Use of shell_exec() function' }
    ];
    
    for (const func of dangerousFunctions) {
      const matches = code.match(func.pattern);
      if (matches) {
        findings.push({
          type: 'DANGEROUS_FUNCTION',
          severity: func.severity,
          message: func.message,
          matches: matches.length,
          recommendation: 'Use safer alternatives or implement proper validation'
        });
      }
    }
    
    // Check for SQL injection patterns
    const sqlPatterns = [
      /query\s*\+\s*['"]/gi,
      /\$[a-zA-Z_][a-zA-Z0-9_]*\s*\.\s*['"]/gi,
      /["'].*?\+.*?["']/gi
    ];
    
    for (const pattern of sqlPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        findings.push({
          type: 'SQL_INJECTION_RISK',
          severity: 'HIGH',
          message: 'Potential SQL injection vulnerability',
          matches: matches.length,
          recommendation: 'Use parameterized queries or prepared statements'
        });
      }
    }
    
    return {
      findings,
      riskScore: findings.reduce((sum, f) => sum + this.riskLevels[f.severity], 0)
    };
  }

  /**
   * AI-powered security analysis
   */
  async performAISecurityAnalysis(code, context, preAnalysis) {
    const securityPrompt = this.buildSecurityAnalysisPrompt(code, context, preAnalysis);
    
    const aiResult = await this.claude.analyzeCode(code, 'security', {
      systemPrompt: securityPrompt.systemPrompt,
      maxTokens: 3000,
      temperature: 0.05 // Low temperature for consistent security analysis
    });
    
    if (!aiResult.success) {
      throw new Error(`AI security analysis failed: ${aiResult.error}`);
    }
    
    // Parse AI response
    const analysis = this.parseAISecurityResponse(aiResult.response);
    
    return {
      success: true,
      analysis,
      rawResponse: aiResult.response,
      usage: aiResult.usage,
      executionTime: aiResult.executionTime
    };
  }

  /**
   * Pattern-based vulnerability detection
   */
  async performPatternAnalysis(code, context) {
    const vulnerabilities = [];
    
    for (const [category, patterns] of this.securityPatterns) {
      for (const pattern of patterns) {
        const matches = this.findPatternMatches(code, pattern);
        if (matches.length > 0) {
          vulnerabilities.push({
            category,
            pattern: pattern.name,
            severity: pattern.severity,
            description: pattern.description,
            matches: matches.length,
            lines: matches.map(m => m.line),
            recommendation: pattern.recommendation
          });
        }
      }
    }
    
    return {
      vulnerabilities,
      totalFindings: vulnerabilities.length,
      riskScore: vulnerabilities.reduce((sum, v) => sum + this.riskLevels[v.severity], 0)
    };
  }

  /**
   * Dependency security analysis
   */
  async analyzeDependencies(code, context) {
    const dependencies = [];
    const vulnerabilities = [];
    
    // Extract dependencies from package.json, requirements.txt, etc.
    const depPatterns = [
      { pattern: /"([^"]+)"\s*:\s*"([^"]+)"/g, type: 'npm' },
      { pattern: /import\s+(?:[\w\s{},*]+\s+from\s+)?['"']([^'"]+)['"]/g, type: 'import' },
      { pattern: /require\s*\(\s*['"']([^'"]+)['"]\s*\)/g, type: 'require' }
    ];
    
    for (const depPattern of depPatterns) {
      let match;
      while ((match = depPattern.pattern.exec(code)) !== null) {
        dependencies.push({
          name: match[1],
          version: match[2] || 'unknown',
          type: depPattern.type
        });
      }
    }
    
    // Check against known vulnerability database
    for (const dep of dependencies) {
      const knownVulns = await this.checkVulnerabilityDatabase(dep.name, dep.version);
      vulnerabilities.push(...knownVulns);
    }
    
    return {
      dependencies,
      vulnerabilities,
      totalDependencies: dependencies.length,
      vulnerableDependencies: vulnerabilities.length
    };
  }

  /**
   * Combine analysis results
   */
  combineAnalysisResults(results) {
    const allVulnerabilities = [];
    const allWarnings = [];
    
    // Combine pre-analysis findings
    if (results.preAnalysis.findings) {
      allVulnerabilities.push(...results.preAnalysis.findings);
    }
    
    // Combine AI analysis findings
    if (results.aiAnalysis.success && results.aiAnalysis.analysis.vulnerabilities) {
      allVulnerabilities.push(...results.aiAnalysis.analysis.vulnerabilities);
    }
    
    if (results.aiAnalysis.success && results.aiAnalysis.analysis.warnings) {
      allWarnings.push(...results.aiAnalysis.analysis.warnings);
    }
    
    // Combine pattern analysis findings
    if (results.patternAnalysis.vulnerabilities) {
      allVulnerabilities.push(...results.patternAnalysis.vulnerabilities);
    }
    
    // Combine dependency analysis findings
    if (results.dependencyAnalysis.vulnerabilities) {
      allVulnerabilities.push(...results.dependencyAnalysis.vulnerabilities);
    }
    
    // Deduplicate and prioritize
    const uniqueVulnerabilities = this.deduplicateFindings(allVulnerabilities);
    const prioritizedVulnerabilities = this.prioritizeFindings(uniqueVulnerabilities);
    
    return {
      vulnerabilities: prioritizedVulnerabilities,
      warnings: allWarnings,
      summary: {
        totalVulnerabilities: prioritizedVulnerabilities.length,
        criticalVulnerabilities: prioritizedVulnerabilities.filter(v => v.severity === 'CRITICAL').length,
        highVulnerabilities: prioritizedVulnerabilities.filter(v => v.severity === 'HIGH').length,
        mediumVulnerabilities: prioritizedVulnerabilities.filter(v => v.severity === 'MEDIUM').length,
        lowVulnerabilities: prioritizedVulnerabilities.filter(v => v.severity === 'LOW').length
      }
    };
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(combinedResults, context) {
    const { vulnerabilities, warnings, summary } = combinedResults;
    
    const reportPrompt = `Generate a comprehensive security report based on the following analysis:

**Vulnerabilities Found**: ${summary.totalVulnerabilities}
- Critical: ${summary.criticalVulnerabilities}
- High: ${summary.highVulnerabilities}
- Medium: ${summary.mediumVulnerabilities}
- Low: ${summary.lowVulnerabilities}

**Key Vulnerabilities**:
${vulnerabilities.slice(0, 5).map(v => `- ${v.severity}: ${v.message || v.description}`).join('\n')}

**Context**:
- Language: ${context.language || 'Unknown'}
- Framework: ${context.framework || 'Unknown'}
- File Type: ${context.fileType || 'Unknown'}

Please provide:
1. Executive summary
2. Risk assessment
3. Priority recommendations
4. Remediation steps
5. Best practices advice`;

    const reportResult = await this.claude.sendMessage(reportPrompt, {
      systemPrompt: 'You are a cybersecurity expert generating a professional security analysis report. Focus on actionable recommendations and clear risk communication.',
      maxTokens: 2000,
      temperature: 0.1
    });

    return {
      success: reportResult.success,
      report: reportResult.success ? reportResult.response : 'Report generation failed',
      executionTime: reportResult.executionTime
    };
  }

  /**
   * Calculate overall risk score
   */
  calculateRiskScore(combinedResults) {
    const { vulnerabilities } = combinedResults;
    
    let totalScore = 0;
    let weightedScore = 0;
    
    for (const vuln of vulnerabilities) {
      const baseScore = this.riskLevels[vuln.severity] || 1;
      const multiplier = vuln.matches || 1;
      
      totalScore += baseScore * multiplier;
      
      // Apply weighting based on vulnerability type
      if (vuln.type === 'SECRET_EXPOSURE') {
        weightedScore += baseScore * multiplier * 2;
      } else if (vuln.type === 'SQL_INJECTION_RISK') {
        weightedScore += baseScore * multiplier * 1.5;
      } else {
        weightedScore += baseScore * multiplier;
      }
    }
    
    return Math.min(100, Math.round(weightedScore));
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations(combinedResults, riskScore) {
    const recommendations = [];
    const { vulnerabilities, summary } = combinedResults;
    
    // Critical vulnerabilities
    if (summary.criticalVulnerabilities > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Address Critical Security Vulnerabilities',
        description: `${summary.criticalVulnerabilities} critical vulnerabilities found that require immediate attention.`,
        actions: [
          'Review and fix all critical vulnerabilities before deployment',
          'Implement emergency security patches',
          'Conduct security team review',
          'Consider rolling back if already deployed'
        ]
      });
    }
    
    // High-risk vulnerabilities
    if (summary.highVulnerabilities > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Fix High-Risk Security Issues',
        description: `${summary.highVulnerabilities} high-risk vulnerabilities detected.`,
        actions: [
          'Prioritize fixing high-risk vulnerabilities',
          'Implement proper input validation',
          'Add security testing to CI/CD pipeline',
          'Review authentication and authorization logic'
        ]
      });
    }
    
    // General security improvements
    if (riskScore > 30) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Improve Overall Security Posture',
        description: 'Multiple security issues detected that should be addressed.',
        actions: [
          'Implement security code review process',
          'Add static analysis security testing (SAST)',
          'Update security training for development team',
          'Establish security coding standards'
        ]
      });
    }
    
    // Dependency security
    const depVulns = vulnerabilities.filter(v => v.category === 'DEPENDENCY');
    if (depVulns.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Update Vulnerable Dependencies',
        description: `${depVulns.length} vulnerable dependencies detected.`,
        actions: [
          'Update all vulnerable dependencies to latest versions',
          'Implement dependency scanning in CI/CD',
          'Monitor for new vulnerability disclosures',
          'Consider alternative packages if updates unavailable'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  
  initializeSecurityPatterns() {
    const patterns = new Map();
    
    // XSS patterns
    patterns.set('XSS', [
      {
        name: 'innerHTML-assignment',
        pattern: /\.innerHTML\s*=\s*[^;]+/gi,
        severity: 'MEDIUM',
        description: 'Direct innerHTML assignment may lead to XSS',
        recommendation: 'Use textContent or sanitize input'
      },
      {
        name: 'document-write',
        pattern: /document\.write\s*\(/gi,
        severity: 'MEDIUM',
        description: 'document.write() can be exploited for XSS',
        recommendation: 'Use modern DOM methods instead'
      }
    ]);
    
    // SQL Injection patterns
    patterns.set('SQL_INJECTION', [
      {
        name: 'string-concatenation',
        pattern: /['"]\s*\+\s*\w+\s*\+\s*['"]/gi,
        severity: 'HIGH',
        description: 'SQL query string concatenation',
        recommendation: 'Use parameterized queries'
      }
    ]);
    
    // Authentication patterns
    patterns.set('AUTH', [
      {
        name: 'weak-password-validation',
        pattern: /password\.length\s*[<>=]+\s*[1-5]/gi,
        severity: 'MEDIUM',
        description: 'Weak password length validation',
        recommendation: 'Enforce stronger password requirements'
      }
    ]);
    
    return patterns;
  }

  buildSecurityAnalysisPrompt(code, context, preAnalysis) {
    return {
      systemPrompt: `You are a cybersecurity expert analyzing code for vulnerabilities. 
      
      Focus on:
      - Authentication and authorization flaws
      - Input validation vulnerabilities
      - XSS and injection attacks
      - Cryptographic weaknesses
      - Business logic vulnerabilities
      - Privacy and data protection issues
      
      Provide structured analysis with:
      - Specific vulnerability types
      - Risk levels (CRITICAL, HIGH, MEDIUM, LOW)
      - Exploitation scenarios
      - Remediation recommendations
      
      Pre-analysis found ${preAnalysis.findings.length} potential issues.`
    };
  }

  parseAISecurityResponse(response) {
    // Parse structured AI response
    const vulnerabilities = [];
    const warnings = [];
    
    // Extract vulnerabilities
    const vulnRegex = /(?:vulnerability|vuln|risk).*?:?\s*(.+?)(?:\n|$)/gi;
    let match;
    
    while ((match = vulnRegex.exec(response)) !== null) {
      vulnerabilities.push({
        type: 'AI_DETECTED',
        severity: this.extractSeverity(match[1]) || 'MEDIUM',
        message: match[1].trim(),
        source: 'ai-analysis'
      });
    }
    
    // Extract warnings
    const warningRegex = /(?:warning|caution|note).*?:?\s*(.+?)(?:\n|$)/gi;
    
    while ((match = warningRegex.exec(response)) !== null) {
      warnings.push({
        type: 'AI_WARNING',
        message: match[1].trim(),
        source: 'ai-analysis'
      });
    }
    
    return {
      vulnerabilities,
      warnings,
      summary: response.substring(0, 200) + '...'
    };
  }

  extractSeverity(text) {
    const severityMap = {
      'critical': 'CRITICAL',
      'high': 'HIGH',
      'medium': 'MEDIUM',
      'low': 'LOW'
    };
    
    for (const [keyword, level] of Object.entries(severityMap)) {
      if (text.toLowerCase().includes(keyword)) {
        return level;
      }
    }
    
    return null;
  }

  findPatternMatches(code, pattern) {
    const matches = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (pattern.pattern.test(line)) {
        matches.push({
          line: i + 1,
          content: line.trim()
        });
      }
    }
    
    return matches;
  }

  async checkVulnerabilityDatabase(packageName, version) {
    // This would integrate with real vulnerability databases
    // For now, return mock data
    return [];
  }

  deduplicateFindings(findings) {
    const seen = new Set();
    const unique = [];
    
    for (const finding of findings) {
      const key = `${finding.type}-${finding.severity}-${finding.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(finding);
      }
    }
    
    return unique;
  }

  prioritizeFindings(findings) {
    const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
    
    return findings.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.severity);
      const bPriority = priorityOrder.indexOf(b.severity);
      return aPriority - bPriority;
    });
  }

  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'INFO';
  }

  generateAnalysisId() {
    return crypto.randomBytes(8).toString('hex');
  }

  async recordSecurityLearning(result) {
    if (this.config.get('learning.enableLearning')) {
      await this.config.recordLearning('securityAnalysis', {
        analysisId: result.analysisId,
        riskScore: result.analysis.riskScore,
        vulnerabilityCount: result.analysis.vulnerabilities.length,
        success: result.success,
        executionTime: result.executionTime
      });
    }
  }

  /**
   * Get security analysis statistics
   */
  getSecurityStats() {
    return {
      supportedPatterns: Array.from(this.securityPatterns.keys()),
      totalPatterns: Array.from(this.securityPatterns.values()).reduce((sum, patterns) => sum + patterns.length, 0),
      riskLevels: Object.keys(this.riskLevels),
      apiUsage: this.claude.getUsageStats()
    };
  }
}

module.exports = SecurityAnalyzer;