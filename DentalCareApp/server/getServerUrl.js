const os = require("os");

// Function to get local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    for (const connection of networkInterface) {
      // Skip internal and non-IPv4 addresses
      if (!connection.internal && connection.family === "IPv4") {
        return connection.address;
      }
    }
  }
  return "localhost";
}

// Function to get all possible server URLs in priority order
function getServerDiscoveryUrls() {
  const localIP = getLocalIpAddress();
  const networkBase = localIP.substring(0, localIP.lastIndexOf("."));

  return {
    localIP,
    priorityUrls: [
      `http://${localIP}:5001`,
      "http://localhost:5001",
      "http://127.0.0.1:5001",
      "http://192.168.1.1:5001",
      "http://192.168.0.1:5001",
      "http://10.0.0.1:5001",
    ],
    networkRange: {
      base: networkBase,
      start: 10,
      end: 20,
    },
  };
}

module.exports = { getLocalIpAddress, getServerDiscoveryUrls };
