let cachedServerUrl = null;
let lastDiscoveryTime = 0;
let discoveryInProgress = false;

const PRIVATE_NETWORKS = {
  classC: { subnets: [1, 0, 18, 2, 10, 11, 15, 20, 100], devices: [1, 15, 10, 11, 20, 100, 254] },
  classA: { subnets: [0, 1], devices: [1, 10, 15, 20, 100, 254] },
  classB: { subnets: [16, 20, 31], devices: [1, 10, 15, 254] }
};

const generateNetworkAddresses = () => {
  const addresses = new Set();
  PRIVATE_NETWORKS.classC.subnets.forEach(s => PRIVATE_NETWORKS.classC.devices.forEach(d => addresses.add(`192.168.${s}.${d}`)));
  PRIVATE_NETWORKS.classA.subnets.forEach(s => PRIVATE_NETWORKS.classA.devices.forEach(d => addresses.add(`10.${s}.0.${d}`)));
  PRIVATE_NETWORKS.classB.subnets.forEach(s => PRIVATE_NETWORKS.classB.devices.forEach(d => addresses.add(`172.${s}.0.${d}`)));
  return Array.from(addresses);
};

// Forces your known actual computer IP to the very front of the line!
const HIGH_PRIORITY_IPS = [
  "192.168.18.15", 
  ...generateNetworkAddresses()
];

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
  if (cachedServerUrl && (now - lastDiscoveryTime < 300000)) return cachedServerUrl;
  
  // Scans the first 30 IPs immediately, catching the .18 subnet
  const quickResults = await Promise.allSettled(HIGH_PRIORITY_IPS.slice(0, 30).map(ip => testSingleEndpoint(ip, 150)));
  for (const result of quickResults) {
    if (result.status === 'fulfilled' && result.value) {
      cachedServerUrl = result.value;
      lastDiscoveryTime = now;
      return cachedServerUrl;
    }
  }
  performBackgroundDiscovery();
  return `http://${HIGH_PRIORITY_IPS[0]}:5001`;
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