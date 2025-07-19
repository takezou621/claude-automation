/**
 * Tests for Branch Pattern Manager
 * 
 * Comprehensive test suite covering all functionality including:
 * - Pattern selection logic
 * - Branch name generation and validation
 * - Existing branch detection
 * - Branch name sanitization
 */

const BranchPatternManager = require('../src/branch-pattern-manager');

describe('BranchPatternManager', () => {
  let manager;

  beforeEach(() => {
    manager = new BranchPatternManager();
  });

  describe('Pattern Selection', () => {
    test('selects bugfix pattern for bug issues', () => {
      const result = manager.selectPattern({ number: 123, title: 'Fix bug', labels: [{name: 'bug'}] });
      expect(result.pattern).toBe('issue-fix');
      expect(result.detectedType).toBe('bug');
    });

    test('selects feature pattern for feature requests', () => {
      const result = manager.selectPattern({ number: 124, title: 'Add feature', labels: [{name: 'feature'}] });
      expect(result.pattern).toBe('issue-feature');
      expect(result.detectedType).toBe('feature');
    });

    test('selects hotfix pattern for critical bug issues', () => {
      const result = manager.selectPattern({ number: 125, title: 'Critical bug', labels: [{name: 'bug'}, {name: 'critical'}] });
      expect(result.pattern).toBe('issue-hotfix');
      expect(result.priority).toBe('critical');
    });

    test('selects enhancement pattern for enhancement issues', () => {
      const result = manager.selectPattern({ number: 126, title: 'Enhancement', labels: [{name: 'enhancement'}] });
      expect(result.pattern).toBe('issue-enhancement');
      expect(result.detectedType).toBe('enhancement');
    });

    test('selects docs pattern for documentation issues', () => {
      const result = manager.selectPattern({ number: 127, title: 'Update docs', labels: [{name: 'documentation'}] });
      expect(result.pattern).toBe('issue-docs');
      expect(result.detectedType).toBe('docs');
    });

    test('selects refactor pattern for refactoring issues', () => {
      const result = manager.selectPattern({ number: 128, title: 'Refactor code', labels: [{name: 'refactor'}] });
      expect(result.pattern).toBe('issue-refactor');
      expect(result.detectedType).toBe('refactor');
    });

    test('selects test pattern for testing issues', () => {
      const result = manager.selectPattern({ number: 129, title: 'Add tests', labels: [{name: 'test'}] });
      expect(result.pattern).toBe('issue-test');
      expect(result.detectedType).toBe('test');
    });

    test('selects chore pattern for maintenance issues', () => {
      const result = manager.selectPattern({ number: 130, title: 'Chore task', labels: [{name: 'ci'}] });
      expect(result.pattern).toBe('issue-ci');
      expect(result.detectedType).toBe('ci');
    });

    test('selects release pattern for release issues', () => {
      const result = manager.selectPattern({ title: 'Release version', labels: [] }, { preferIssueNumber: false });
      expect(result.pattern).toBe('feature');
      expect(result.detectedType).toBe('feature');
    });

    test('defaults to feature pattern for unknown types', () => {
      const result = manager.selectPattern({ number: 131, title: 'Unknown task', labels: [] });
      expect(result.pattern).toBe('issue-feature');
      expect(result.detectedType).toBe('feature');
    });
  });

  describe('Branch Name Generation', () => {
    test('generates feature branch name', () => {
      const result = manager.generateBranchName('feature', { title: 'Add new authentication' });
      expect(result.name).toBe('feature/add-new-authentication');
      expect(result.pattern).toBe('feature');
    });

    test('generates bugfix branch name', () => {
      const result = manager.generateBranchName('bugfix', { title: 'Fix validation error' });
      expect(result.name).toBe('bugfix/fix-validation-error');
      expect(result.pattern).toBe('bugfix');
    });

    test('generates hotfix branch name', () => {
      const result = manager.generateBranchName('hotfix', { title: 'Critical security fix' });
      expect(result.name).toBe('hotfix/critical-security-fix');
      expect(result.pattern).toBe('hotfix');
    });

    test('generates feature branch with scope', () => {
      const result = manager.generateBranchName('feature-scoped', { 
        title: 'Add user management', 
        scope: 'auth' 
      });
      expect(result.name).toBe('feature/auth/add-user-management');
      expect(result.pattern).toBe('feature-scoped');
    });

    test('generates release branch with version', () => {
      const result = manager.generateBranchName('release', { version: '1.2.3' });
      expect(result.name).toBe('release/1.2.3');
      expect(result.pattern).toBe('release');
    });

    test('adds priority prefix for high priority', () => {
      const result = manager.generateBranchName('bugfix', { title: 'Important fix' }, 'high');
      expect(result.name).toBe('high/bugfix/important-fix');
      expect(result.priority).toBe('high');
    });

    test('adds priority prefix for critical priority', () => {
      const result = manager.generateBranchName('feature', { title: 'Critical feature' }, 'critical');
      expect(result.name).toBe('critical/feature/critical-feature');
      expect(result.priority).toBe('critical');
    });

    test('throws error for unknown pattern', () => {
      expect(() => {
        manager.generateBranchName('unknown-pattern', { title: 'test' });
      }).toThrow("Pattern 'unknown-pattern' not found");
    });
  });

  describe('Branch Name Sanitization', () => {
    test('sanitizes title with special characters', () => {
      const sanitized = manager.sanitizeTitle('Fix: Special @#$% Characters!');
      expect(sanitized).toBe('fix-special-characters');
    });

    test('sanitizes title with spaces', () => {
      const sanitized = manager.sanitizeTitle('Add new user authentication system');
      expect(sanitized).toBe('add-new-user-authentication-system');
    });

    test('sanitizes title with consecutive spaces', () => {
      const sanitized = manager.sanitizeTitle('Multiple    spaces   here');
      expect(sanitized).toBe('multiple-spaces-here');
    });

    test('sanitizes title with leading/trailing dashes', () => {
      const sanitized = manager.sanitizeTitle('--leading and trailing--');
      expect(sanitized).toBe('leading-and-trailing');
    });

    test('truncates long titles', () => {
      const longTitle = 'a'.repeat(60);
      const sanitized = manager.sanitizeTitle(longTitle);
      expect(sanitized).toHaveLength(50);
    });

    test('sanitizes scope with special characters', () => {
      const sanitized = manager.sanitizeScope('auth@system!');
      expect(sanitized).toBe('authsystem');
    });

    test('truncates long scopes', () => {
      const longScope = 'a'.repeat(30);
      const sanitized = manager.sanitizeScope(longScope);
      expect(sanitized).toHaveLength(20);
    });

    test('sanitizes complete branch name', () => {
      const sanitized = manager.sanitizeBranchName('feature//issue@123--test');
      expect(sanitized).toBe('feature/issue123-test');
    });

    test('removes consecutive slashes from branch name', () => {
      const sanitized = manager.sanitizeBranchName('feature///subfolder////name');
      expect(sanitized).toBe('feature/subfolder/name');
    });

    test('removes leading/trailing slashes from branch name', () => {
      const sanitized = manager.sanitizeBranchName('/feature/test/');
      expect(sanitized).toBe('feature/test');
    });

    test('truncates long branch names', () => {
      const longBranchName = 'feature/' + 'a'.repeat(100);
      const sanitized = manager.sanitizeBranchName(longBranchName);
      expect(sanitized).toHaveLength(100);
    });
  });

  describe('Branch Name Validation', () => {
    test('validates correct branch names', () => {
      const validNames = [
        'feature/add-authentication',
        'bugfix/fix-validation-error',
        'hotfix/critical-security-fix',
        'high/feature/important-feature',
        'release/1-2-3'
      ];

      validNames.forEach(name => {
        const result = manager.validateBranchName(name);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('rejects branch names that are too long', () => {
      const longName = 'a'.repeat(101);
      const result = manager.validateBranchName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Branch name too long (max 100 characters)');
    });

    test('rejects branch names with invalid characters', () => {
      const result = manager.validateBranchName('branch@name#with$special%chars');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Branch name contains invalid characters');
    });

    test('rejects branch names with consecutive slashes', () => {
      const result = manager.validateBranchName('feature//issue-123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Branch name contains consecutive slashes or dashes');
    });

    test('rejects branch names with consecutive dashes', () => {
      const result = manager.validateBranchName('feature/issue--123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Branch name contains consecutive slashes or dashes');
    });

    test('rejects branch names starting with slash', () => {
      const result = manager.validateBranchName('/feature/test');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Branch name cannot start or end with slash');
    });

    test('rejects branch names ending with slash', () => {
      const result = manager.validateBranchName('feature/test/');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Branch name cannot start or end with slash');
    });

    test('warns about very short branch names', () => {
      const result = manager.validateBranchName('ab');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Branch name is very short');
    });
  });

  describe('Pattern Detection', () => {
    test('detects feature pattern', () => {
      const result = manager.detectPattern('feature/add-authentication');
      expect(result.pattern).toBe('feature');
      expect(result.matches).toBe(true);
      expect(result.priority).toBe('medium');
    });

    test('detects bugfix pattern', () => {
      const result = manager.detectPattern('bugfix/fix-validation');
      expect(result.pattern).toBe('bugfix');
      expect(result.matches).toBe(true);
    });

    test('detects hotfix pattern', () => {
      const result = manager.detectPattern('hotfix/critical-fix');
      expect(result.pattern).toBe('hotfix');
      expect(result.matches).toBe(true);
    });

    test('detects priority prefix', () => {
      const result = manager.detectPattern('high/feature/important-feature');
      expect(result.pattern).toBe('feature');
      expect(result.priority).toBe('high');
      expect(result.matches).toBe(true);
    });

    test('detects critical priority prefix', () => {
      const result = manager.detectPattern('critical/bugfix/security-issue');
      expect(result.pattern).toBe('bugfix');
      expect(result.priority).toBe('critical');
      expect(result.matches).toBe(true);
    });

    test('detects release pattern with version', () => {
      const result = manager.detectPattern('release/1.2.3');
      expect(result.pattern).toBe('release');
      expect(result.matches).toBe(true);
    });

    test('returns no match for unknown pattern', () => {
      const result = manager.detectPattern('unknown/pattern');
      expect(result.pattern).toBe(null);
      expect(result.matches).toBe(false);
      expect(result.confidence).toBe(0);
    });

    test('calculates confidence score', () => {
      const result = manager.detectPattern('feature/add-authentication');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Pattern Recommendations', () => {
    test('analyzes recent branches for recommendations', () => {
      const recentBranches = [
        'feature/add-auth',
        'feature/add-validation',
        'bugfix/fix-error',
        'hotfix/critical-fix',
        'feature/enhance-ui'
      ];

      const recommendations = manager.getPatternRecommendations(recentBranches);
      
      expect(recommendations.mostUsed).toBeDefined();
      expect(recommendations.recommended).toBeDefined();
      expect(recommendations.usage).toBeDefined();
      expect(recommendations.mostUsed[0].pattern).toBe('feature'); // Most used pattern
    });

    test('recommends issue-feature pattern when no recent branches', () => {
      const recommendations = manager.getPatternRecommendations([]);
      expect(recommendations.recommended).toBe('issue-feature');
    });

    test('returns usage statistics', () => {
      const recentBranches = [
        'feature/test1',
        'feature/test2',
        'bugfix/test3'
      ];

      const recommendations = manager.getPatternRecommendations(recentBranches);
      
      expect(recommendations.usage.feature).toBe(2);
      expect(recommendations.usage.bugfix).toBe(1);
    });
  });

  describe('Available Patterns', () => {
    test('returns all available patterns', () => {
      const patterns = manager.getAvailablePatterns();
      
      expect(patterns).toHaveProperty('feature');
      expect(patterns).toHaveProperty('bugfix');
      expect(patterns).toHaveProperty('hotfix');
      expect(patterns).toHaveProperty('enhancement');
      expect(patterns).toHaveProperty('docs');
      expect(patterns).toHaveProperty('refactor');
      expect(patterns).toHaveProperty('test');
      expect(patterns).toHaveProperty('chore');
      expect(patterns).toHaveProperty('release');
      
      expect(Object.keys(patterns).length).toBeGreaterThanOrEqual(9);
    });

    test('pattern templates contain placeholders', () => {
      const patterns = manager.getAvailablePatterns();
      
      expect(patterns.feature).toContain('{title}');
      expect(patterns.release).toContain('{version}');
      expect(patterns['feature-scoped']).toContain('{scope}');
    });
  });

  describe('Integration Tests', () => {
    test('complete workflow: select pattern, generate name, validate', () => {
      // Select pattern
      const selection = manager.selectPattern({ number: 123, title: 'Add user authentication system', labels: [{name: 'feature'}] });
      expect(selection.pattern).toBe('issue-feature');
      expect(selection.priority).toBe('medium');

      // Generate branch name
      const result = manager.generateBranchName(selection.pattern, { 
        title: 'Add user authentication system',
        number: 123
      }, selection.priority);
      expect(result.name).toBe('feature/issue-123');

      // Validate branch name
      const validation = manager.validateBranchName(result.name);
      expect(validation.isValid).toBe(true);
    });

    test('complete workflow with special characters', () => {
      const selection = manager.selectPattern({ number: 456, title: 'Fix: Special @#$% Characters!', labels: [{name: 'bug'}] });
      const result = manager.generateBranchName(selection.pattern, { 
        title: 'Fix: Special @#$% Characters!',
        number: 456
      });
      
      expect(result.name).toBe('fix/issue-456');
      
      const validation = manager.validateBranchName(result.name);
      expect(validation.isValid).toBe(true);
    });

    test('detect pattern from generated branch name', () => {
      const originalPattern = 'enhancement';
      const result = manager.generateBranchName(originalPattern, { 
        title: 'Improve performance' 
      });
      
      const detection = manager.detectPattern(result.name);
      expect(detection.pattern).toBe(originalPattern);
      expect(detection.matches).toBe(true);
    });
  });
});