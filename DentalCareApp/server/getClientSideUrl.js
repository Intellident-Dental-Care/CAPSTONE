// High-performance client-side URL discovery with caching

// Cache for discovered server URL
let cachedServerUrl = null;
let lastDiscoveryTime = 0;
let discoveryInProgress = false;

// RFC 1918 Private Network Address Ranges
const PRIVATE_NETWORKS = {
  // Class C networks (192.168.0.0/16) - Most common for home/small office
  classC: {
    subnets: [1, 0, 18, 2, 10, 11, 15, 20, 100],
    devices: [1, 15, 10, 11, 20, 100, 254]
  },
  
  // Class A networks (10.0.0.0/8) - Enterprise networks
  classA: {
    subnets: [0, 1],
    devices: [1, 10, 15, 20, 100, 254]
  },
  
  // Class B networks (172.16.0.0/12) - Medium enterprise
  classB: {
    subnets: [16, 20, 31],
    devices: [1, 10, 15, 254]
  }
};

// Generate prioritized IP addresses based on network probability
const generateNetworkAddresses = () => {
  const addresses = new Set();

  // Class C networks (highest priority - most common)
  PRIVATE_NETWORKS.classC.subnets.forEach(subnet => {
    PRIVATE_NETWORKS.classC.devices.forEach(device => {
      addresses.add(`192.168.${subnet}.${device}`);
    });
  });

  // Class A networks (medium priority)
  PRIVATE_NETWORKS.classA.subnets.forEach(subnet => {
    PRIVATE_NETWORKS.classA.devices.forEach(device => {
      addresses.add(`10.${subnet}.0.${device}`);
    });
  });

  // Class B networks (lower priority)
  PRIVATE_NETWORKS.classB.subnets.forEach(subnet => {
    PRIVATE_NETWORKS.classB.devices.forEach(device => {
      addresses.add(`172.${subnet}.0.${device}`);
    });
  });

  return Array.from(addresses);
};

const HIGH_PRIORITY_IPS = generateNetworkAddresses().slice(0, 15);
const EXTENDED_IPS = generateNetworkAddresses();

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
  } catch (error) {
    // Silent fail for performance
  }
  return null;
};

const performBackgroundDiscovery = async () => {
  if (discoveryInProgress) return;
  discoveryInProgress = true;

  try {
    // Parallel scan of high-priority addresses
    const results = await Promise.allSettled(
      HIGH_PRIORITY_IPS.map(ip => testSingleEndpoint(ip, 200))
    );

    // Check for successful discovery
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        cachedServerUrl = result.value;
        lastDiscoveryTime = Date.now();
        console.log(`Server cached: ${cachedServerUrl}`);
        discoveryInProgress = false;
        return cachedServerUrl;
      }
    }

    // Extended sequential search if needed
    const remainingIPs = EXTENDED_IPS.slice(HIGH_PRIORITY_IPS.length);
    for (const ip of remainingIPs) {
      const result = await testSingleEndpoint(ip, 400);
      if (result) {
        cachedServerUrl = result;
        lastDiscoveryTime = Date.now();
        console.log(`Server found and cached: ${cachedServerUrl}`);
        discoveryInProgress = false;
        return cachedServerUrl;
      }
    }

  } catch (error) {
    console.log('Background discovery error:', error.message);
  } finally {
    discoveryInProgress = false;
  }

  return null;
};

export const getServerUrl = async () => {
  const now = Date.now();
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Return cached URL if still valid
  if (cachedServerUrl && (now - lastDiscoveryTime < CACHE_DURATION)) {
    console.log(`Using cached server: ${cachedServerUrl}`);
    return cachedServerUrl;
  }

  console.log("Discovering server...");

  // Quick parallel scan of most probable addresses
  const quickScanIPs = HIGH_PRIORITY_IPS.slice(0, 8);
  const quickResults = await Promise.allSettled(
    quickScanIPs.map(ip => testSingleEndpoint(ip, 150))
  );

  // Return immediately if found
  for (const result of quickResults) {
    if (result.status === 'fulfilled' && result.value) {
      cachedServerUrl = result.value;
      lastDiscoveryTime = now;
      console.log(`Server found instantly: ${cachedServerUrl}`);
      return cachedServerUrl;
    }
  }

  // Start background discovery for comprehensive search
  performBackgroundDiscovery();

  // Return most probable fallback address
  const fallbackUrl = `http://${HIGH_PRIORITY_IPS[0]}:5001`;
  console.log(`Using fallback: ${fallbackUrl}`);
  return fallbackUrl;
};

// Initialize background discovery on module load
setTimeout(() => {
  if (!cachedServerUrl) {
    performBackgroundDiscovery();
  }
}, 100);

// Get the actual network interface IP of the current device
export const getCurrentNetworkIP = async () => {
  try {
    // Try to get the actual network IP by making a request to a known endpoint
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    
    // This gives us the public IP, but we need the local network IP
    // Let's use a different approach - test our own server
    const localIPs = HIGH_PRIORITY_IPS;
    
    for (const ip of localIPs) {
      try {
        const testResponse = await fetch(`http://${ip}:5001/network-info`, {
          method: 'GET',
          timeout: 500
        });
        
        if (testResponse.ok) {
          const networkInfo = await testResponse.json();
          return networkInfo.localIP || ip;
        }
      } catch (e) {
        // Continue to next IP
      }
    }
    
    // Fallback to the first high priority IP
    return HIGH_PRIORITY_IPS[0];
  } catch (error) {
    console.log('Could not determine network IP, using fallback');
    return HIGH_PRIORITY_IPS[0];
  }
};
