const LIVE_RENDER_URL = process.env.EXPO_PUBLIC_API_URL;

export const getServerUrl = async () => {
  return LIVE_RENDER_URL;
};

export const getCurrentNetworkIP = async () => {
  return null; 
};

export const setDeepLinkServerIP = (ip) => {
  console.log('[Discovery] Deep link IP ignored, using live server');
};

export const getDeepLinkServerIP = () => {
  return null;
};

export const setManualServerUrl = (url) => {
  console.log('[Discovery] Manual URL set ignored, using live server');
};

export const getManualServerUrl = () => {
  return LIVE_RENDER_URL;
};