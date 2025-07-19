/**
 * Branch Pattern Manager
 * Manages branch naming patterns for different issue types and priorities
 */

class BranchPatternManager {
  constructor () {
    // Issue-based patterns (GitHub requirements)
    this.issuePatterns = {
      // Standard issue patterns
      'issue-basic': 'issue-{number}',
      'claude-basic': 'claude-{number}',
      'automation-basic': 'automation-{number}',

      // Categorized issue patterns
      'issue-feature': 'feature/issue-{number}',
      'issue-fix': 'fix/issue-{number}',
      'issue-hotfix': 'hotfix/issue-{number}',
      'issue-security': 'security/issue-{number}',
      'issue-enhancement': 'enhancement/issue-{number}',
      'issue-claude': 'claude/issue-{number}',
      'issue-docs': 'docs/issue-{number}',
      'issue-test': 'test/issue-{number}',
      'issue-refactor': 'refactor/issue-{number}',
      'issue-performance': 'performance/issue-{number}',
      'issue-ci': 'ci/issue-{number}'
    };

    // Traditional title-based patterns
    this.titlePatterns = {
      // Feature patterns
      feature: 'feature/{title}',
      'feature-scoped': 'feature/{scope}/{title}',
      feat: 'feat/{title}',

      // Bug fix patterns
      bugfix: 'bugfix/{title}',
      bug: 'bug/{title}',
      fix: 'fix/{title}',

      // Hotfix patterns
      hotfix: 'hotfix/{title}',
      patch: 'patch/{title}',

      // Enhancement patterns
      enhancement: 'enhancement/{title}',
      improve: 'improve/{title}',

      // Documentation patterns
      docs: 'docs/{title}',
      documentation: 'documentation/{title}',

      // Refactoring patterns
      refactor: 'refactor/{title}',
      refact: 'refact/{title}',

      // Testing patterns
      test: 'test/{title}',
      testing: 'testing/{title}',

      // Chore patterns
      chore: 'chore/{title}',
      maintenance: 'maintenance/{title}',

      // Release patterns
      release: 'release/{version}',
      version: 'version/{version}'
    };

    // Combined patterns for backwards compatibility
    this.patterns = {
      ...this.issuePatterns,
      ...this.titlePatterns
    };

    this.priorityPrefixes = {
      critical: 'critical',
      high: 'high',
      medium: 'med',
      low: 'low'
    };

    this.issueTypeMapping = {
      bug: ['bugfix', 'bug', 'fix', 'issue-fix'],
      feature: ['feature', 'feat', 'feature-scoped', 'issue-feature'],
      enhancement: ['enhancement', 'improve', 'issue-enhancement'],
      documentation: ['docs', 'documentation', 'issue-docs'],
      refactor: ['refactor', 'refact', 'issue-refactor'],
      test: ['test', 'testing', 'issue-test'],
      hotfix: ['hotfix', 'patch', 'issue-hotfix'],
      chore: ['chore', 'maintenance', 'issue-ci'],
      release: ['release', 'version'],
      security: ['security', 'issue-security'],
      performance: ['performance', 'issue-performance'],
      automation: ['automation-basic', 'claude-basic', 'issue-claude']
    };
  }

  /**
   * Get available branch patterns
   * @param {string} type - Pattern type ('issue', 'title', 'all')
   * @returns {Object} Available patterns
   */
  getAvailablePatterns (type = 'all') {
    switch (type) {
      case 'issue':
        return { ...this.issuePatterns };
      case 'title':
        return { ...this.titlePatterns };
      case 'all':
      default:
        return { ...this.patterns };
    }
  }

  /**
   * Get issue-specific patterns (GitHub issue number based)
   * @returns {Object} Issue-based patterns
   */
  getIssuePatterns () {
    return { ...this.issuePatterns };
  }

  /**
   * Get title-based patterns (traditional patterns)
   * @returns {Object} Title-based patterns
   */
  getTitlePatterns () {
    return { ...this.titlePatterns };
  }

  /**
   * Select pattern based on issue object and options
   * @param {Object} issue - GitHub issue object with number, title, labels, etc.
   * @param {Object} options - Selection options
   * @returns {Object} Selected pattern information
   */
  selectPattern (issue, options = {}) {
    const { preferSecurity = false, preferIssueNumber = true } = options;

    // Extract issue information
    const issueNumber = issue.number || issue.issue_number;
    const issueTitle = issue.title || '';
    const issueLabels = issue.labels || [];
    const issueBody = issue.body || '';

    // Determine issue type from labels and title
    const detectedType = this.detectIssueType(issueTitle, issueLabels, issueBody);
    const priority = this.detectPriority(issueLabels, issueTitle);

    let selectedPattern;

    // Security preference override
    if (preferSecurity && (detectedType === 'security' || this.isSecurityRelated(issueTitle, issueLabels))) {
      selectedPattern = 'issue-security';
    } else if (priority === 'critical' && detectedType === 'bug') {
      // Critical issues get hotfix pattern
      selectedPattern = 'issue-hotfix';
    } else if (preferIssueNumber && issueNumber) {
      // Use issue-number based patterns by default
      selectedPattern = this.mapTypeToIssuePattern(detectedType);
    } else {
      // Fallback to title-based patterns
      selectedPattern = this.mapTypeToTitlePattern(detectedType);
    }

    return {
      pattern: selectedPattern,
      detectedType,
      priority,
      issueNumber,
      confidence: this.calculateSelectionConfidence(detectedType, priority, issueTitle, issueLabels)
    };
  }

  /**
   * Detect issue type from title, labels, and body
   * @param {string} title - Issue title
   * @param {Array} labels - Issue labels
   * @param {string} body - Issue body
   * @returns {string} Detected issue type
   */
  detectIssueType (title, labels, body) {
    const titleLower = title.toLowerCase();
    const bodyLower = body.toLowerCase();
    const labelNames = labels.map(label =>
      (typeof label === 'string' ? label : label.name || '').toLowerCase()
    );

    // Check labels first (most reliable)
    if (labelNames.includes('security') || labelNames.includes('vulnerability')) return 'security';
    if (labelNames.includes('hotfix') || labelNames.includes('critical')) return 'hotfix';
    if (labelNames.includes('bug') || labelNames.includes('bugfix')) return 'bug';
    if (labelNames.includes('enhancement')) return 'enhancement';
    if (labelNames.includes('feature')) return 'feature';
    if (labelNames.includes('documentation') || labelNames.includes('docs')) return 'docs';
    if (labelNames.includes('test') || labelNames.includes('testing')) return 'test';
    if (labelNames.includes('refactor') || labelNames.includes('refactoring')) return 'refactor';
    if (labelNames.includes('performance') || labelNames.includes('optimization')) return 'performance';
    if (labelNames.includes('ci') || labelNames.includes('continuous-integration')) return 'ci';

    // Check title keywords
    if (titleLower.includes('security') || titleLower.includes('vulnerability')) return 'security';
    if (titleLower.includes('hotfix') || titleLower.includes('urgent')) return 'hotfix';
    if (titleLower.includes('bug') || titleLower.includes('fix') || titleLower.includes('error')) return 'bug';
    if (titleLower.includes('feature') || titleLower.includes('add') || titleLower.includes('implement')) return 'feature';
    if (titleLower.includes('doc') || titleLower.includes('readme')) return 'docs';
    if (titleLower.includes('test') || titleLower.includes('testing')) return 'test';
    if (titleLower.includes('refactor') || titleLower.includes('restructure')) return 'refactor';
    if (titleLower.includes('performance') || titleLower.includes('optimize')) return 'performance';
    if (titleLower.includes('ci') || titleLower.includes('workflow')) return 'ci';

    // Check body keywords
    if (bodyLower.includes('security') || bodyLower.includes('vulnerability')) return 'security';
    if (bodyLower.includes('enhancement') || bodyLower.includes('improve')) return 'feature';

    // Default to feature
    return 'feature';
  }

  /**
   * Detect priority from labels and title
   * @param {Array} labels - Issue labels
   * @param {string} title - Issue title
   * @returns {string} Priority level
   */
  detectPriority (labels, title) {
    const labelNames = labels.map(label =>
      (typeof label === 'string' ? label : label.name || '').toLowerCase()
    );
    const titleLower = title.toLowerCase();

    // Check priority labels
    if (labelNames.includes('priority:critical') || labelNames.includes('critical')) return 'critical';
    if (labelNames.includes('priority:high') || labelNames.includes('high')) return 'high';
    if (labelNames.includes('priority:medium') || labelNames.includes('medium')) return 'medium';
    if (labelNames.includes('priority:low') || labelNames.includes('low')) return 'low';

    // Check urgency indicators
    if (labelNames.includes('urgent') || labelNames.includes('hotfix')) return 'critical';
    if (titleLower.includes('urgent') || titleLower.includes('critical')) return 'critical';
    if (titleLower.includes('important') || titleLower.includes('high')) return 'high';

    return 'medium';
  }

  /**
   * Check if issue is security-related
   * @param {string} title - Issue title
   * @param {Array} labels - Issue labels
   * @returns {boolean} Whether issue is security-related
   */
  isSecurityRelated (title, labels) {
    const titleLower = title.toLowerCase();
    const labelNames = labels.map(label =>
      (typeof label === 'string' ? label : label.name || '').toLowerCase()
    );

    const securityKeywords = [
      'security', 'vulnerability', 'exploit', 'attack', 'injection',
      'xss', 'csrf', 'authentication', 'authorization', 'privilege'
    ];

    return securityKeywords.some(keyword =>
      titleLower.includes(keyword) || labelNames.includes(keyword)
    );
  }

  /**
   * Map issue type to issue-number based pattern
   * @param {string} type - Issue type
   * @returns {string} Pattern name
   */
  mapTypeToIssuePattern (type) {
    const mapping = {
      security: 'issue-security',
      hotfix: 'issue-hotfix',
      bug: 'issue-fix',
      feature: 'issue-feature',
      enhancement: 'issue-enhancement',
      docs: 'issue-docs',
      test: 'issue-test',
      refactor: 'issue-refactor',
      performance: 'issue-performance',
      ci: 'issue-ci'
    };

    return mapping[type] || 'issue-basic';
  }

  /**
   * Map issue type to title-based pattern
   * @param {string} type - Issue type
   * @returns {string} Pattern name
   */
  mapTypeToTitlePattern (type) {
    const mapping = {
      security: 'security',
      hotfix: 'hotfix',
      bug: 'fix',
      feature: 'feature',
      enhancement: 'enhancement',
      docs: 'docs',
      test: 'test',
      refactor: 'refactor',
      performance: 'performance',
      ci: 'chore'
    };

    return mapping[type] || 'feature';
  }

  /**
   * Calculate confidence score for pattern selection
   * @param {string} type - Detected type
   * @param {string} priority - Detected priority
   * @param {string} title - Issue title
   * @param {Array} labels - Issue labels
   * @returns {number} Confidence score (0-1)
   */
  calculateSelectionConfidence (type, priority, title, labels) {
    let confidence = 0.5; // Base confidence

    // Increase confidence if we have explicit labels
    const labelNames = labels.map(label =>
      (typeof label === 'string' ? label : label.name || '').toLowerCase()
    );

    if (labelNames.includes(type) || labelNames.includes(`priority:${priority}`)) {
      confidence += 0.3;
    }

    // Increase confidence if title contains type keywords
    if (title.toLowerCase().includes(type)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate branch name from pattern
   * @param {string} patternName - Pattern to use
   * @param {Object} context - Context with title, scope, version, number, etc.
   * @param {string} priority - Priority level
   * @returns {Object} Generated branch info
   */
  generateBranchName (patternName, context, priority = 'medium') {
    const pattern = this.patterns[patternName];
    if (!pattern) {
      throw new Error(`Pattern '${patternName}' not found`);
    }

    let branchName = pattern;

    // Replace placeholders
    if (context.number || context.issue_number) {
      const issueNumber = context.number || context.issue_number;
      branchName = branchName.replace('{number}', issueNumber);
    }

    if (context.title) {
      branchName = branchName.replace('{title}', this.sanitizeTitle(context.title));
    }

    if (context.scope) {
      branchName = branchName.replace('{scope}', this.sanitizeScope(context.scope));
    }

    if (context.version) {
      branchName = branchName.replace('{version}', this.sanitizeVersion(context.version));
    }

    // Add priority prefix for high priority items
    if (priority === 'critical' || priority === 'high') {
      const prefix = this.priorityPrefixes[priority];
      branchName = `${prefix}/${branchName}`;
    }

    const sanitizedName = this.sanitizeBranchName(branchName);

    // Return object with both name and pattern (workflow compatibility)
    return {
      name: sanitizedName,
      pattern: patternName,
      originalPattern: pattern,
      priority,
      context
    };
  }

  /**
   * Sanitize title for branch name
   * @param {string} title - Title to sanitize
   * @returns {string} Sanitized title
   */
  sanitizeTitle (title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Sanitize scope for branch name
   * @param {string} scope - Scope to sanitize
   * @returns {string} Sanitized scope
   */
  sanitizeScope (scope) {
    return scope
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 20);
  }

  /**
   * Sanitize version for branch name
   * @param {string} version - Version to sanitize
   * @returns {string} Sanitized version
   */
  sanitizeVersion (version) {
    return version
      .replace(/[^a-z0-9.-]/g, '')
      .substring(0, 20);
  }

  /**
   * Sanitize full branch name
   * @param {string} branchName - Branch name to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized branch name
   */
  sanitizeBranchName (branchName, options = {}) {
    const { preserveCase = false, maxLength = 100 } = options;

    let sanitized = branchName;

    // Convert to lowercase unless preserving case
    if (!preserveCase) {
      sanitized = sanitized.toLowerCase();
    }

    // Remove invalid characters
    sanitized = sanitized.replace(/[^a-zA-Z0-9\-/.]/g, '');

    // Fix consecutive separators
    sanitized = sanitized.replace(/\/+/g, '/');
    sanitized = sanitized.replace(/-+/g, '-');

    // Remove leading/trailing separators
    sanitized = sanitized.replace(/^\/|\/$/g, '');
    sanitized = sanitized.replace(/^-|-$/g, '');

    // Truncate to max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      // Try to break at a separator if possible
      const lastSeparator = Math.max(
        sanitized.lastIndexOf('/'),
        sanitized.lastIndexOf('-')
      );
      if (lastSeparator > maxLength * 0.7) {
        sanitized = sanitized.substring(0, lastSeparator);
      }
    }

    return sanitized;
  }

  /**
   * Validate branch name
   * @param {string} branchName - Branch name to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateBranchName (branchName, options = {}) {
    const { strict = false, allowUppercase = false } = options;
    const errors = [];
    const warnings = [];

    // Check length
    if (branchName.length > 100) {
      errors.push('Branch name too long (max 100 characters)');
    }

    // Check for invalid characters
    const validCharPattern = allowUppercase ? /^[a-zA-Z0-9\-/.]+$/ : /^[a-z0-9\-/.]+$/;
    if (!validCharPattern.test(branchName)) {
      errors.push('Branch name contains invalid characters');
    }

    // Check for consecutive slashes or dashes
    if (/\/\/|--/.test(branchName)) {
      errors.push('Branch name contains consecutive slashes or dashes');
    }

    // Check for leading/trailing slashes or dashes
    if (branchName.startsWith('/') || branchName.endsWith('/')) {
      errors.push('Branch name cannot start or end with slash');
    }

    if (branchName.startsWith('-') || branchName.endsWith('-')) {
      warnings.push('Branch name starts or ends with dash');
    }

    // Check for very short names
    if (branchName.length < 3) {
      warnings.push('Branch name is very short');
    }

    // Check for GitHub reserved names
    const reservedNames = ['master', 'main', 'develop', 'dev', 'staging', 'prod', 'production'];
    if (reservedNames.includes(branchName.toLowerCase())) {
      errors.push('Branch name uses reserved word');
    }

    // Issue number validation for issue-based patterns
    if (branchName.includes('issue-') || branchName.includes('claude-') || branchName.includes('automation-')) {
      const numberMatch = branchName.match(/-(\d+)/);
      if (!numberMatch) {
        warnings.push('Issue-based branch name missing issue number');
      } else {
        const issueNumber = parseInt(numberMatch[1]);
        if (issueNumber < 1 || issueNumber > 999999) {
          warnings.push('Issue number seems invalid');
        }
      }
    }

    // Strict mode additional checks
    if (strict) {
      // Check for common typos
      if (branchName.includes('_')) {
        errors.push('Branch name contains underscore (use dash instead)');
      }

      // Check for proper separator usage
      if (branchName.includes('/') && !branchName.includes('/')) {
        warnings.push('Consider using category/name pattern');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: this.generateValidationSuggestions(branchName, errors, warnings)
    };
  }

  /**
   * Generate suggestions for branch name validation issues
   * @param {string} branchName - Original branch name
   * @param {Array} errors - Validation errors
   * @param {Array} warnings - Validation warnings
   * @returns {Array} Suggestions for improvement
   */
  generateValidationSuggestions (branchName, errors, warnings) {
    const suggestions = [];

    if (errors.some(e => e.includes('too long'))) {
      suggestions.push(`Try shortening to: ${branchName.substring(0, 80)}...`);
    }

    if (errors.some(e => e.includes('invalid characters'))) {
      const cleaned = branchName.replace(/[^a-z0-9\-/.]/g, '-');
      suggestions.push(`Try: ${cleaned}`);
    }

    if (errors.some(e => e.includes('consecutive'))) {
      const cleaned = branchName.replace(/\/\//g, '/').replace(/--/g, '-');
      suggestions.push(`Try: ${cleaned}`);
    }

    if (warnings.some(w => w.includes('very short'))) {
      suggestions.push(`Consider a more descriptive name than "${branchName}"`);
    }

    return suggestions;
  }

  /**
   * Detect pattern from existing branch name
   * @param {string} branchName - Existing branch name
   * @returns {Object} Detection result
   */
  detectPattern (branchName) {
    const normalizedName = branchName.toLowerCase();

    // Check for priority prefixes
    let priority = 'medium';
    let cleanName = normalizedName;

    for (const [priorityLevel, prefix] of Object.entries(this.priorityPrefixes)) {
      if (normalizedName.startsWith(`${prefix}/`)) {
        priority = priorityLevel;
        cleanName = normalizedName.substring(prefix.length + 1);
        break;
      }
    }

    // Try to match patterns
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      const patternRegex = this.createPatternRegex(pattern);
      if (patternRegex.test(cleanName)) {
        return {
          pattern: patternName,
          priority,
          matches: true,
          confidence: this.calculateConfidence(cleanName, pattern)
        };
      }
    }

    return {
      pattern: null,
      priority,
      matches: false,
      confidence: 0
    };
  }

  /**
   * Create regex from pattern
   * @param {string} pattern - Pattern to convert
   * @returns {RegExp} Generated regex
   */
  createPatternRegex (pattern) {
    const escapedPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\{number\\\}/g, '[0-9]+')
      .replace(/\\\{title\\\}/g, '[a-z0-9-]+')
      .replace(/\\\{scope\\\}/g, '[a-z0-9-]+')
      .replace(/\\\{version\\\}/g, '[a-z0-9.-]+');

    return new RegExp(`^${escapedPattern}$`);
  }

  /**
   * Calculate confidence score for pattern match
   * @param {string} branchName - Branch name
   * @param {string} pattern - Pattern
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence (branchName, pattern) {
    const patternParts = pattern.split('/');
    const nameParts = branchName.split('/');

    if (patternParts.length !== nameParts.length) {
      return 0.5;
    }

    let matches = 0;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].includes('{')) {
        matches += 0.5; // Placeholder match
      } else if (patternParts[i] === nameParts[i]) {
        matches += 1; // Exact match
      }
    }

    return matches / patternParts.length;
  }

  /**
   * Get pattern recommendations based on repository activity
   * @param {Array} recentBranches - Recent branch names
   * @param {Object} options - Recommendation options
   * @returns {Object} Recommendations
   */
  getPatternRecommendations (recentBranches = [], options = {}) {
    const { preferIssuePatterns = true, includeConfidence = true } = options;
    const patternUsage = {};
    const patternConfidence = {};

    // Analyze recent branches
    recentBranches.forEach(branch => {
      const detection = this.detectPattern(branch);
      if (detection.matches) {
        patternUsage[detection.pattern] = (patternUsage[detection.pattern] || 0) + 1;
        patternConfidence[detection.pattern] =
          (patternConfidence[detection.pattern] || 0) + detection.confidence;
      }
    });

    // Calculate average confidence
    Object.keys(patternConfidence).forEach(pattern => {
      patternConfidence[pattern] = patternConfidence[pattern] / patternUsage[pattern];
    });

    // Sort by usage frequency and confidence
    const sortedPatterns = Object.entries(patternUsage)
      .map(([pattern, usage]) => ({
        pattern,
        usage,
        confidence: patternConfidence[pattern] || 0,
        isIssuePattern: pattern.includes('issue-') || pattern.includes('claude-') || pattern.includes('automation-')
      }))
      .sort((a, b) => {
        // Prefer issue patterns if requested
        if (preferIssuePatterns && a.isIssuePattern !== b.isIssuePattern) {
          return a.isIssuePattern ? -1 : 1;
        }
        // Sort by usage, then confidence
        if (a.usage !== b.usage) {
          return b.usage - a.usage;
        }
        return b.confidence - a.confidence;
      })
      .slice(0, 5);

    // Default recommendation based on preferences
    let defaultRecommendation;
    if (preferIssuePatterns) {
      defaultRecommendation = 'issue-feature';
    } else {
      defaultRecommendation = 'feature';
    }

    return {
      mostUsed: sortedPatterns,
      recommended: sortedPatterns.length > 0 ? sortedPatterns[0].pattern : defaultRecommendation,
      usage: patternUsage,
      confidence: includeConfidence ? patternConfidence : undefined,
      analysis: {
        totalBranches: recentBranches.length,
        matchedBranches: Object.values(patternUsage).reduce((a, b) => a + b, 0),
        issuePatternUsage: sortedPatterns.filter(p => p.isIssuePattern).length,
        titlePatternUsage: sortedPatterns.filter(p => !p.isIssuePattern).length
      }
    };
  }
}

module.exports = BranchPatternManager;
