let cachedServerUrl = null;
let lastDiscoveryTime = 0;
let discoveryInProgress = false;
let detectedLocalNetwork = null;

const generateCommonNetworkAddresses = () => {
  const addresses = [];
  // 192.168.x.x range (most common)
  [1, 0, 18, 2, 10, 11, 15, 20, 100].forEach(s => {
    [1, 15, 10, 11, 20, 100, 254].forEach(d => addresses.push(`192.168.${s}.${d}`));
  });
  // 10.x.x.x range
  [0, 1, 28, 32].forEach(s => {
    [1, 15, 10, 11, 20, 100, 254, 182].forEach(d => addresses.push(`10.${s}.${d}.1`));
    addresses.push(`10.${s}.33.182`); // Common local IP
  });
  // 172.16-31.x.x range
  for (let s = 16; s <= 31; s++) {
    [1, 15, 10, 254].forEach(d => addresses.push(`172.${s}.0.${d}`));
  }
  return addresses;
};

// Prioritize servers based on proximity to local network
const getPrioritizedIPs = () => {
  const addresses = generateCommonNetworkAddresses();
  
  // Move likely candidates to front
  const prioritized = [
    '10.28.33.182',
    'localhost',
    '127.0.0.1'
  ];
  
  // Add remaining addresses, removing duplicates
  const seen = new Set(prioritized);
  for (const addr of addresses) {
    if (!seen.has(addr)) {
      prioritized.push(addr);
      seen.add(addr);
    }
  }
  
  return prioritized;
};

const HIGH_PRIORITY_IPS = getPrioritizedIPs();
const EXTENDED_IPS = generateCommonNetworkAddresses();

const testSingleEndpoint = async (ip, timeout = 300) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(`http://${ip}:5001/server-discovery`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return data.serverInfo.currentUrl;
    }
  } catch (error) {}
  return null;
};

const performBackgroundDiscovery = async () => {
  if (discoveryInProgress) return;
  discoveryInProgress = true;
  try {
    const results = await Promise.allSettled(HIGH_PRIORITY_IPS.slice(0, 15).map(ip => testSingleEndpoint(ip, 200)));
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        cachedServerUrl = result.value;
        lastDiscoveryTime = Date.now();
        discoveryInProgress = false;
        return cachedServerUrl;
      }
    }
    const remainingIPs = EXTENDED_IPS.slice(15);
    for (const ip of remainingIPs) {
      const result = await testSingleEndpoint(ip, 400);
      if (result) {
        cachedServerUrl = result;
        lastDiscoveryTime = Date.now();
        discoveryInProgress = false;
        return cachedServerUrl;
      }
    }
  } catch (error) {
  } finally {
    discoveryInProgress = false;
  }
  return null;
};

export const getServerUrl = async () => {
  const now = Date.now();
  
  // Return cached URL if still valid (5 minute cache)
  if (cachedServerUrl && (now - lastDiscoveryTime < 300000)) {
    return cachedServerUrl;
  }
  
  // Try quick discovery with short timeouts on priority IPs
  const quickResults = await Promise.allSettled(
    HIGH_PRIORITY_IPS.slice(0, 20).map(ip => testSingleEndpoint(ip, 100))
  );
  
  for (const result of quickResults) {
    if (result.status === 'fulfilled' && result.value) {
      cachedServerUrl = result.value;
      lastDiscoveryTime = now;
      console.log('[Discovery] Found server at:', cachedServerUrl);
      return cachedServerUrl;
    }
  }
  
  // If quick discovery failed, try remaining IPs in background
  performBackgroundDiscovery();
  
  // Return cached URL or null (don't guess)
  if (cachedServerUrl) return cachedServerUrl;
  
  console.warn('[Discovery] Server not found, returning localhost fallback');
  return 'http://localhost:5001';
};

setTimeout(() => { if (!cachedServerUrl) performBackgroundDiscovery(); }, 100);

export const getCurrentNetworkIP = async () => {
  try {
    for (const ip of HIGH_PRIORITY_IPS.slice(0, 15)) {
      try {
        const testResponse = await fetch(`http://${ip}:5001/network-info`, { method: 'GET', timeout: 500 });
        if (testResponse.ok) return (await testResponse.json()).localIP || ip;
      } catch (e) {}
    }
    return HIGH_PRIORITY_IPS[0];
  } catch (error) {
    return HIGH_PRIORITY_IPS[0];
  }
};