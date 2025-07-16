/**
 * Secure execution utilities for GitHub Actions
 * Prevents command injection vulnerabilities
 */

const { spawn } = require('child_process');
const util = require('util');

/**
 * Secure alternative to execAsync that prevents command injection
 * @param {string} command - The command to execute
 * @param {string[]} args - Array of arguments
 * @param {Object} options - Spawn options
 * @returns {Promise<string>} - Promise that resolves to stdout
 */
function secureSpawn(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Secure git operations
 */
const secureGit = {
  /**
   * Safely checkout a branch
   * @param {string} branchName - Branch name
   */
  async checkout(branchName) {
    const sanitized = sanitizeBranchNameForCheckout(branchName);
    return secureSpawn('git', ['checkout', sanitized]);
  },
  
  /**
   * Safely create and checkout a new branch
   * @param {string} branchName - Sanitized branch name
   */
  async checkoutNewBranch(branchName) {
    const sanitized = sanitizeBranchName(branchName);
    return secureSpawn('git', ['checkout', '-b', sanitized]);
  },
  
  /**
   * Safely merge a branch
   * @param {string} branchName - Sanitized branch name
   */
  async merge(branchName) {
    const sanitized = sanitizeBranchName(branchName);
    return secureSpawn('git', ['merge', sanitized, '--no-ff']);
  },
  
  /**
   * Safely push to remote
   * @param {string} remote - Remote name
   * @param {string} branch - Branch name
   */
  async push(remote, branch) {
    const sanitizedRemote = sanitizeRemoteName(remote);
    const sanitizedBranch = sanitizeBranchName(branch);
    return secureSpawn('git', ['push', sanitizedRemote, sanitizedBranch]);
  },
  
  /**
   * Safely delete a branch
   * @param {string} branchName - Sanitized branch name
   */
  async deleteBranch(branchName) {
    const sanitized = sanitizeBranchName(branchName);
    return secureSpawn('git', ['branch', '-d', sanitized]);
  },
  
  /**
   * Safely commit changes
   * @param {string} message - Commit message
   */
  async commit(message) {
    const sanitized = sanitizeCommitMessage(message);
    return secureSpawn('git', ['commit', '-m', sanitized]);
  },
  
  /**
   * Safely add files
   * @param {string[]} files - Array of file paths
   */
  async add(files = ['.']) {
    const sanitizedFiles = files.map(file => sanitizeFilePath(file));
    return secureSpawn('git', ['add', ...sanitizedFiles]);
  },
  
  /**
   * Get remote branches safely
   */
  async getRemoteBranches() {
    return secureSpawn('git', ['branch', '-r']);
  },
  
  /**
   * Configure git user safely
   * @param {string} email - Email address
   * @param {string} name - User name
   */
  async configUser(email, name) {
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeName(name);
    
    await secureSpawn('git', ['config', 'user.email', sanitizedEmail]);
    await secureSpawn('git', ['config', 'user.name', sanitizedName]);
  }
};

/**
 * Input sanitization functions
 */

/**
 * Sanitize branch name to prevent injection
 * @param {string} branchName - Raw branch name
 * @returns {string} - Sanitized branch name
 */
function sanitizeBranchName(branchName) {
  if (!branchName || typeof branchName !== 'string') {
    throw new Error('Branch name must be a non-empty string');
  }
  
  // Remove dangerous characters and limit length
  const sanitized = branchName
    .slice(0, 200) // Limit length
    .replace(/[^a-zA-Z0-9\-_\/\.]/g, '-') // Replace dangerous chars
    .replace(/^[-\.]+|[-\.]+$/g, '') // Remove leading/trailing dots/hyphens
    .replace(/\.\.+/g, '.'); // Collapse multiple dots
  
  // Validate result
  if (!sanitized || sanitized.length < 1) {
    throw new Error('Branch name became empty after sanitization');
  }
  
  // Prevent reserved names
  const reservedNames = ['HEAD', 'refs', 'origin', 'master', 'main'];
  if (reservedNames.includes(sanitized)) {
    throw new Error(`Branch name '${sanitized}' is reserved`);
  }
  
  return sanitized;
}

/**
 * Sanitize branch name for checkout operations (allows reserved names)
 * @param {string} branchName - Raw branch name
 * @returns {string} - Sanitized branch name
 */
function sanitizeBranchNameForCheckout(branchName) {
  if (!branchName || typeof branchName !== 'string') {
    throw new Error('Branch name must be a non-empty string');
  }
  
  // Remove dangerous characters and limit length
  const sanitized = branchName
    .slice(0, 200) // Limit length
    .replace(/[^a-zA-Z0-9\-_\/\.]/g, '-') // Replace dangerous chars
    .replace(/^[-\.]+|[-\.]+$/g, '') // Remove leading/trailing dots/hyphens
    .replace(/\.\.+/g, '.'); // Collapse multiple dots
  
  // Validate result
  if (!sanitized || sanitized.length < 1) {
    throw new Error('Branch name became empty after sanitization');
  }
  
  // Allow reserved names for checkout (existing branches)
  return sanitized;
}

/**
 * Sanitize remote name
 * @param {string} remoteName - Raw remote name
 * @returns {string} - Sanitized remote name
 */
function sanitizeRemoteName(remoteName) {
  if (!remoteName || typeof remoteName !== 'string') {
    throw new Error('Remote name must be a non-empty string');
  }
  
  const sanitized = remoteName
    .slice(0, 50)
    .replace(/[^a-zA-Z0-9\-_]/g, '');
  
  if (!sanitized || sanitized.length < 1) {
    throw new Error('Remote name became empty after sanitization');
  }
  
  return sanitized;
}

/**
 * Sanitize commit message
 * @param {string} message - Raw commit message
 * @returns {string} - Sanitized commit message
 */
function sanitizeCommitMessage(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Commit message must be a non-empty string');
  }
  
  // Remove dangerous characters but preserve normal punctuation
  const sanitized = message
    .slice(0, 500) // Limit length
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .replace(/[`$\\]/g, '') // Remove shell metacharacters
    .trim();
  
  if (!sanitized || sanitized.length < 1) {
    throw new Error('Commit message became empty after sanitization');
  }
  
  return sanitized;
}

/**
 * Sanitize file path
 * @param {string} filePath - Raw file path
 * @returns {string} - Sanitized file path
 */
function sanitizeFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string');
  }
  
  // Prevent directory traversal and dangerous characters
  const sanitized = filePath
    .slice(0, 500)
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/[`$\\;|&<>]/g, '') // Remove shell metacharacters
    .trim();
  
  if (!sanitized || sanitized.length < 1) {
    throw new Error('File path became empty after sanitization');
  }
  
  return sanitized;
}

/**
 * Sanitize email address
 * @param {string} email - Raw email
 * @returns {string} - Sanitized email
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string');
  }
  
  // Basic email validation and sanitization
  const sanitized = email
    .slice(0, 200)
    .replace(/[^a-zA-Z0-9@\.\-_]/g, '')
    .trim();
  
  if (!sanitized || !sanitized.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitize user name
 * @param {string} name - Raw name
 * @returns {string} - Sanitized name
 */
function sanitizeName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Name must be a non-empty string');
  }
  
  const sanitized = name
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9\s\-_\.]/g, '')
    .trim();
  
  if (!sanitized || sanitized.length < 1) {
    throw new Error('Name became empty after sanitization');
  }
  
  return sanitized;
}

module.exports = {
  secureSpawn,
  secureGit,
  sanitizeBranchName,
  sanitizeBranchNameForCheckout,
  sanitizeRemoteName,
  sanitizeCommitMessage,
  sanitizeFilePath,
  sanitizeEmail,
  sanitizeName
};