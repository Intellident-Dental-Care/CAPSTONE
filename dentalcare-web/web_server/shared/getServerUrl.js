import os from "os";

export const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();

  for (const interfaceName of Object.keys(interfaces)) {
    for (const connection of interfaces[interfaceName] || []) {
      if (!connection.internal && connection.family === "IPv4") {
        return connection.address;
      }
    }
  }

  return "127.0.0.1";
};

export const getServerDiscoveryUrls = (port) => {
  const localIP = getLocalIpAddress();
  return {
    localIP,
    urls: [
      `http://${localIP}:${port}`,
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
    ],
  };
};
