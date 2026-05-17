const loginAttempts = new Map();

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getClientIp(req) {
  return req.ip || req.connection?.remoteAddress || "unknown";
}

export const bruteForceProtection = (req, res, next) => {
  const ip = getClientIp(req);
  const now = Date.now();

  let record = loginAttempts.get(ip) || {
    count: 0,
    lockoutUntil: 0,
    lastAttempt: now,
  };

  if (now - record.lastAttempt > ONE_DAY_MS) {
    record = {
      count: 0,
      lockoutUntil: 0,
      lastAttempt: now,
    };
  }

  if (now < record.lockoutUntil) {
    const remainingMinutes = Math.ceil((record.lockoutUntil - now) / 60000);

    return res.status(429).json({
      success: false,
      message: `Account locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
    });
  }

  loginAttempts.set(ip, record);
  next();
};

export const recordFailedLoginAttempt = (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();

  let record = loginAttempts.get(ip) || {
    count: 0,
    lockoutUntil: 0,
    lastAttempt: now,
  };

  record.count += 1;
  record.lastAttempt = now;

  if (record.count % 5 === 0) {
    const penaltyTier = record.count / 5;
    const cooldownMinutes = penaltyTier * 5;

    record.lockoutUntil = now + cooldownMinutes * 60000;
    loginAttempts.set(ip, record);

    return {
      locked: true,
      cooldownMinutes,
    };
  }

  loginAttempts.set(ip, record);

  return {
    locked: false,
  };
};

export const clearLoginAttempts = (req) => {
  const ip = getClientIp(req);
  loginAttempts.delete(ip);
};

export const sanitizeLoginInputs = (req, res, next) => {
  const { email, password } = req.body;

  if (email) {
    req.body.email = String(email).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }
  }

  if (password) {
    req.body.password = String(password);
  }

  next();
};