/**
 * Brute Force Protection Module
 * Prevents brute force attacks on login endpoints
 */

class BruteForceProtection {
  constructor() {
    // Store attempt history: { email: { attempts: number, lastAttempt: timestamp, lockedUntil: timestamp } }
    this.attempts = new Map();
    
    // Configuration
    this.config = {
      maxAttempts: 5,           // Maximum login attempts allowed
      windowMs: 15 * 60 * 1000, // Time window in milliseconds (15 minutes)
      lockoutTimeMs: 30 * 60 * 1000, // Lockout duration in milliseconds (30 minutes)
      cleanupIntervalMs: 60 * 60 * 1000, // Cleanup old records every hour
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Start interval to clean up old attempt records
   */
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.attempts.entries()) {
        // Remove records older than 2x the lockout time
        if (now - data.lastAttempt > this.config.lockoutTimeMs * 2) {
          this.attempts.delete(key);
        }
      }
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Check if an email is currently locked out
   * @param {string} identifier - Email or user identifier
   * @returns {object} - { isLocked: boolean, remainingTimeMs: number }
   */
  isLocked(identifier) {
    const normalizedId = this.normalizeIdentifier(identifier);
    const record = this.attempts.get(normalizedId);

    if (!record) {
      return { isLocked: false, remainingTimeMs: 0 };
    }

    const now = Date.now();

    // If lockout period has expired, remove the record
    if (record.lockedUntil && now > record.lockedUntil) {
      this.attempts.delete(normalizedId);
      return { isLocked: false, remainingTimeMs: 0 };
    }

    // If currently in lockout period
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingTimeMs = record.lockedUntil - now;
      return { isLocked: true, remainingTimeMs };
    }

    return { isLocked: false, remainingTimeMs: 0 };
  }

  /**
   * Record a failed login attempt
   * @param {string} identifier - Email or user identifier
   * @returns {object} - { success: boolean, attemptsRemaining: number, message: string }
   */
  recordFailedAttempt(identifier) {
    const normalizedId = this.normalizeIdentifier(identifier);
    const now = Date.now();
    let record = this.attempts.get(normalizedId);

    // Create new record if doesn't exist
    if (!record) {
      record = {
        attempts: 0,
        lastAttempt: now,
        lockedUntil: null,
      };
    }

    // Reset attempts if window has expired
    if (now - record.lastAttempt > this.config.windowMs) {
      record.attempts = 0;
    }

    // Increment attempt count
    record.attempts += 1;
    record.lastAttempt = now;

    // Lock account if max attempts exceeded
    if (record.attempts >= this.config.maxAttempts) {
      record.lockedUntil = now + this.config.lockoutTimeMs;
      this.attempts.set(normalizedId, record);

      return {
        success: false,
        attemptsRemaining: 0,
        message: `Too many login attempts. Account locked for ${Math.ceil(this.config.lockoutTimeMs / 60000)} minutes.`,
        lockedUntilMs: record.lockedUntil,
      };
    }

    this.attempts.set(normalizedId, record);

    const attemptsRemaining = this.config.maxAttempts - record.attempts;
    return {
      success: true,
      attemptsRemaining,
      message: attemptsRemaining === 0 
        ? 'No more attempts allowed' 
        : `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining`,
    };
  }

  /**
   * Record a successful login (clears attempt history)
   * @param {string} identifier - Email or user identifier
   */
  recordSuccessfulLogin(identifier) {
    const normalizedId = this.normalizeIdentifier(identifier);
    this.attempts.delete(normalizedId);
  }

  /**
   * Reset the lockout for an identifier (admin function)
   * @param {string} identifier - Email or user identifier
   * @returns {boolean} - True if reset was successful
   */
  resetLockout(identifier) {
    const normalizedId = this.normalizeIdentifier(identifier);
    if (this.attempts.has(normalizedId)) {
      this.attempts.delete(normalizedId);
      return true;
    }
    return false;
  }

  /**
   * Get current attempt status
   * @param {string} identifier - Email or user identifier
   * @returns {object} - Current attempt status
   */
  getStatus(identifier) {
    const normalizedId = this.normalizeIdentifier(identifier);
    const record = this.attempts.get(normalizedId);
    const { isLocked, remainingTimeMs } = this.isLocked(identifier);

    return {
      identifier: normalizedId,
      attempts: record?.attempts || 0,
      isLocked,
      remainingTimeMs,
      maxAttempts: this.config.maxAttempts,
    };
  }

  /**
   * Normalize the identifier (email) to lowercase
   * @param {string} identifier - The identifier to normalize
   * @returns {string} - Normalized identifier
   */
  normalizeIdentifier(identifier) {
    return String(identifier).toLowerCase().trim();
  }

  /**
   * Configure brute force settings
   * @param {object} config - Configuration object
   */
  configure(config) {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get all current locks (useful for admin/monitoring)
   * @returns {array} - Array of locked identifiers
   */
  getAllLocks() {
    const now = Date.now();
    const locks = [];

    for (const [identifier, record] of this.attempts.entries()) {
      if (record.lockedUntil && now < record.lockedUntil) {
        locks.push({
          identifier,
          attempts: record.attempts,
          lockedUntilMs: record.lockedUntil,
          remainingTimeMs: record.lockedUntil - now,
        });
      }
    }

    return locks;
  }
}

// Export singleton instance
module.exports = new BruteForceProtection();
