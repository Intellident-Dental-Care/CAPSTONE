// getClientSideUrl.js

const LIVE_RENDER_URL = 'https://capstone-2-yc72.onrender.com';

export const getServerUrl = async () => {
  console.log('[Discovery] Using live Render server:', LIVE_RENDER_URL);
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