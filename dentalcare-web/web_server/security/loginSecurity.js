// In-memory store to track login attempts by IP address
const loginAttempts = new Map();

export const bruteForceProtection = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  
  // Get existing record for this IP, or create a new one
  let record = loginAttempts.get(ip) || { count: 0, lockoutUntil: 0, lastAttempt: now };

  // Reset the count if a full 24 hours have passed since their last attempt
  if (now - record.lastAttempt > ONE_DAY_MS) {
    record = { count: 0, lockoutUntil: 0, lastAttempt: now };
  }

  // Check if the user is currently serving a lockout cooldown
  if (now < record.lockoutUntil) {
    const remainingMinutes = Math.ceil((record.lockoutUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      message: `Account locked due to too many login attempts. Please try again in ${remainingMinutes} minute(s).`
    });
  }

  // Register this new attempt
  record.count += 1;
  record.lastAttempt = now;

  // Escalating Cooldown Logic (Triggers every 5 attempts: 5, 10, 15...)
  if (record.count % 5 === 0) {
    const penaltyTier = record.count / 5; // Tier 1 (5 attempts), Tier 2 (10 attempts)
    const cooldownMinutes = penaltyTier * 5; // 5 mins, 10 mins, 15 mins...
    
    // Apply the lockout time
    record.lockoutUntil = now + (cooldownMinutes * 60000);
    loginAttempts.set(ip, record);

    // Reject this attempt and tell them the cooldown time
    return res.status(429).json({
      success: false,
      message: `Account locked due to too many login attempts. Please try again in ${cooldownMinutes} minute(s).`
    });
  }

  // Save the updated record and allow the request to proceed to the database
  loginAttempts.set(ip, record);
  next();
};

export const sanitizeLoginInputs = (req, res, next) => {
  const { email, password } = req.body;

  // Ensure email exists, remove accidental leading/trailing spaces, and force lowercase
  if (email) {
    req.body.email = String(email).trim().toLowerCase();
    
    // Basic RegEx to ensure no malicious SQL characters are bypassing as an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format." 
      });
    }
  }

  // Ensure password is a string (Do not trim, as valid passwords can have spaces)
  if (password) {
    req.body.password = String(password);
  }

  next();
};