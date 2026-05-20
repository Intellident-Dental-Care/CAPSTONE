let cachedServerUrl = null;
let lastDiscoveryTime = 0;
let discoveryInProgress = false;
let detectedLocalNetwork = null;
let lastNetworkIdentifier = null; // Track network to detect changes
let deepLinkServerIP = null; // IP extracted from deep link (highest priority)

// Function to identify current network (simple hash of available interfaces)
const getCurrentNetworkIdentifier = async () => {
  try {
    // Try to get network info from a quick endpoint test
    for (const ip of ['localhost', '127.0.0.1']) {
      try {
        const response = await fetch(`http://${ip}:5001/network-info`, { 
          method: 'GET', 
          signal: AbortSignal.timeout ? AbortSignal.timeout(100) : null 
        });
        if (response.ok) {
          const data = await response.json();
          return data.localIP || ip;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return null;
};

// Invalidate cache if network has changed
const checkNetworkChange = async () => {
  const currentNetwork = await getCurrentNetworkIdentifier();
  if (lastNetworkIdentifier && currentNetwork && lastNetworkIdentifier !== currentNetwork) {
    console.log('[Discovery] Network changed detected. Clearing cache.');
    cachedServerUrl = null;
    lastDiscoveryTime = 0;
  }
  if (currentNetwork) {
    lastNetworkIdentifier = currentNetwork;
  }
};

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
  
  // Move likely candidates to front - including 10.x.x.x subnet for cloud/VM environments
  const prioritized = [
    'localhost',
    '127.0.0.1',
    // 10.x.x.x range (cloud, VMs, mobile hotspots)
    ...Array.from({length: 255}, (_, i) => `10.173.${i}.1`),
    ...Array.from({length: 255}, (_, i) => `10.173.37.${i}`), // Specific subnet if known
    '10.28.33.182',
    // Common device IPs
    '192.168.1.1',
    '192.168.1.254',
    '192.168.0.1',
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

const testSingleEndpoint = async (ip, timeout = 500) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);
    
    const response = await fetch(`http://${ip}:5001/server-discovery`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[Discovery] ✅ Found server at IP:', ip, 'URL:', data.serverInfo.currentUrl);
      return data.serverInfo.currentUrl;
    }
  } catch (error) {
    // Silently fail - expected for most IPs
  }
  return null;
};

const performBackgroundDiscovery = async () => {
  if (discoveryInProgress) return;
  discoveryInProgress = true;
  try {
    console.log('[Discovery] Background: Testing first 30 priority IPs...');
    const results = await Promise.allSettled(HIGH_PRIORITY_IPS.slice(0, 30).map(ip => testSingleEndpoint(ip, 300)));
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        cachedServerUrl = result.value;
        lastDiscoveryTime = Date.now();
        discoveryInProgress = false;
        console.log('[Discovery] Background: Success! Found at:', cachedServerUrl);
        return cachedServerUrl;
      }
    }
    console.log('[Discovery] Background: First 30 IPs failed, trying extended list...');
    const remainingIPs = EXTENDED_IPS.slice(30);
    for (const ip of remainingIPs) {
      const result = await testSingleEndpoint(ip, 400);
      if (result) {
        cachedServerUrl = result;
        lastDiscoveryTime = Date.now();
        discoveryInProgress = false;
        console.log('[Discovery] Background: Found at:', cachedServerUrl);
        return cachedServerUrl;
      }
    }
  } catch (error) {
    console.error('[Discovery] Background error:', error);
  } finally {
    discoveryInProgress = false;
  }
  return null;
};

export const getServerUrl = async () => {
  // HIGHEST PRIORITY: Check deep link IP first
  if (deepLinkServerIP) {
    const serverUrl = `http://${deepLinkServerIP}:5001`;
    console.log('[Discovery] ✅ Using deep link IP:', serverUrl);
    return serverUrl;
  }

  // Check for manual override second
  if (manualOverrideUrl) {
    console.log('[Discovery] Using manual override:', manualOverrideUrl);
    return manualOverrideUrl;
  }
  
  const now = Date.now();
  
  // Check if network has changed
  await checkNetworkChange();
  
  // Return cached URL if still valid (2 minute cache - shorter for network changes)
  if (cachedServerUrl && (now - lastDiscoveryTime < 120000)) {
    console.log('[Discovery] Using cached server URL:', cachedServerUrl);
    return cachedServerUrl;
  }
  
  console.log('[Discovery] Starting server discovery (testing first 30 IPs with 500ms timeout)...');
  
  // Try quick discovery with higher timeout on priority IPs
  const quickResults = await Promise.allSettled(
    HIGH_PRIORITY_IPS.slice(0, 30).map(ip => testSingleEndpoint(ip, 500))
  );
  
  for (const result of quickResults) {
    if (result.status === 'fulfilled' && result.value) {
      cachedServerUrl = result.value;
      lastDiscoveryTime = now;
      console.log('[Discovery] ✅ Server found:', cachedServerUrl);
      return cachedServerUrl;
    }
  }
  
  console.log('[Discovery] Quick scan failed, starting background discovery...');
  // If quick discovery failed, try remaining IPs in background
  performBackgroundDiscovery();
  
  // Return cached URL if available, otherwise try localhost
  if (cachedServerUrl) {
    console.log('[Discovery] Using previously cached URL:', cachedServerUrl);
    return cachedServerUrl;
  }
  
  console.warn('[Discovery] ⚠️ Server not found on network, trying localhost as fallback');
  return 'http://localhost:5001';
};

setTimeout(() => { if (!cachedServerUrl) performBackgroundDiscovery(); }, 100);

export const getCurrentNetworkIP = async () => {
  try {
    // Try to get network info from a running server
    for (const ip of HIGH_PRIORITY_IPS.slice(0, 15)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 200);
        const testResponse = await fetch(`http://${ip}:5001/network-info`, { 
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (testResponse.ok) {
          const data = await testResponse.json();
          console.log('[Network] Found server at IP:', data.localIP);
          return data.localIP || ip;
        }
      } catch (e) {}
    }
    console.warn('[Network] Could not determine network IP');
    return null;
  } catch (error) {
    console.error('[Network] Error getting network IP:', error);
    return null;
  }
};

// MANUAL OVERRIDE: Set this manually if auto-discovery fails
// Usage: After importing, call: setManualServerUrl('http://10.173.37.14:5001')
let manualOverrideUrl = null;

// DEEP LINK IP: Automatically extracted from exp://10.173.37.14:8081
export const setDeepLinkServerIP = (ip) => {
  if (ip) {
    deepLinkServerIP = ip;
    const serverUrl = `http://${ip}:5001`;
    cachedServerUrl = serverUrl;
    lastDiscoveryTime = Date.now();
    console.log('[Discovery] 🎯 Deep link IP registered:', ip, '→', serverUrl);
  }
};

export const getDeepLinkServerIP = () => {
  return deepLinkServerIP;
};

export const setManualServerUrl = (url) => {
  if (url) {
    manualOverrideUrl = url;
    cachedServerUrl = url;
    lastDiscoveryTime = Date.now();
    console.log('[Discovery] Manual override set to:', url);
  } else {
    manualOverrideUrl = null;
    console.log('[Discovery] Manual override cleared');
  }
};

export const getManualServerUrl = () => {
  return manualOverrideUrl;
};