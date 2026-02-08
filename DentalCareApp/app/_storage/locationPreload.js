import { useEffect } from 'react';
import { useMapLocation } from '../../server/userMapLocation';

const BRANCHES = [
  {
    key: "molino",
    title: "GC Dental Care - Molino",
    description: "Molino, Bacoor, Cavite",
    latitude: 14.411954191470624,
    longitude: 120.97465944812357,
  },
  {
    key: "dasma",
    title: "GC Dental Care - Dasmariñas",
    description: "110 Sampaloc 1, Dasmariñas, Cavite",
    latitude: 14.298878201393642,
    longitude: 120.95493969551005,
  },
  {
    key: "gnetri",
    title: "GC Dental Care - General Trias",
    description: "Governor's Drive, General Trias, Cavite",
    latitude: 14.291470506437102,
    longitude: 120.90430479550989,
  },
];

// Session tracking to ensure it only runs once per login
let isPreloadComplete = false;
let preloadPromise = null;

// Main preload function that can be called directly
export const preloadLocationData = async () => {
  // Prevent multiple simultaneous preloads
  if (isPreloadComplete || preloadPromise) {
    console.log('⚡ Location preload already complete or in progress');
    return isPreloadComplete;
  }

  console.log('🌟 POST-LOGIN: Starting aggressive location and route preloading...');
  
  preloadPromise = (async () => {
    try {
      // Import here to avoid circular dependencies
      const { initializeLocationInBackground, preloadBranchesData } = await import('../../server/userMapLocation');
      
      // 1. Initialize location in background
      console.log('📍 Step 1: Getting user location...');
      const location = await initializeLocationInBackground();
      
      if (!location) {
        console.log('⚠️ Location not available, user can enable it later');
        return false;
      }

      console.log('✅ Step 1 Complete: Location obtained:', location);
      
      // 2. FORCE preload ALL branch routes
      console.log('🛣️ Step 2: FORCE-caching ALL branch routes...');
      const preloadSuccess = await preloadBranchesData(BRANCHES);
      
      if (preloadSuccess) {
        console.log('🎯 POST-LOGIN PRELOAD COMPLETE: All routes cached for instant access!');
        isPreloadComplete = true;
        return true;
      } else {
        console.log('⚠️ Route preloading had issues, but marking as complete');
        isPreloadComplete = true;
        return false;
      }
      
    } catch (error) {
      console.error('❌ Post-login preload error:', error);
      return false;
    }
  })();

  return await preloadPromise;
};

// Component version (for React integration)
export default function LocationPreloader() {
  const mapLocation = useMapLocation();

  useEffect(() => {
    // Call the main preload function
    preloadLocationData();
  }, []);

  return null;
}

// Export function to check if preload is complete
export const isLocationPreloaded = () => isPreloadComplete;

// Export function to reset preload status (for logout)
export const resetLocationPreload = () => {
  console.log('🔄 Resetting location preload status (for logout)');
  isPreloadComplete = false;
  preloadPromise = null;
};