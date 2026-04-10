import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

// Enhanced location state management
let userLocation = null;
let locationSubscription = null;
let isLocationInitialized = false;
let locationInitPromise = null;

// Get OpenRouteService API key from environment variables
const OPENROUTE_API_KEY = process.env.EXPO_PUBLIC_OPENROUTE_API_KEY;

// Validate API key on import
if (!OPENROUTE_API_KEY) {
  console.warn('⚠️ EXPO_PUBLIC_OPENROUTE_API_KEY not found in .env file. Routing will use fallback mode.');
}

// Route cache for instant loading
let routeCache = new Map();

/**
 * Initialize location in background (call this at app startup)
 */
export const initializeLocationInBackground = async () => {
  if (isLocationInitialized || locationInitPromise) {
    return locationInitPromise || Promise.resolve(userLocation);
  }

  console.log('🌟 Starting background location initialization...');
  
  locationInitPromise = (async () => {
    try {
      const location = await getUserLocation();
      if (location) {
        isLocationInitialized = true;
        userLocation = location;
        console.log('✅ Background location ready:', location);
        
        // Start background location tracking immediately
        startLocationTracking((loc) => {
          userLocation = loc;
          console.log('📍 Background location updated:', loc);
        });
        
        return location;
      }
    } catch (error) {
      console.error('❌ Background location initialization failed:', error);
    } finally {
      locationInitPromise = null;
    }
    return null;
  })();

  return locationInitPromise;
};

/**
 * Get user location instantly (uses cached if available)
 */
export const getUserLocationInstant = async () => {
  // Return cached location immediately if available
  if (userLocation) {
    isLocationInitialized = true;
    console.log('⚡ Using cached location:', userLocation);
    return userLocation;
  }

  // If background init is in progress, wait for it
  if (locationInitPromise) {
    console.log('⏳ Waiting for background location...');
    return await locationInitPromise;
  }

  // Fallback: get location normally
  console.log('🔄 Getting location (fallback)...');
  return await getUserLocation();
};

/**
 * Request location permissions and get user's current location
 */
export const getUserLocation = async () => {
  try {
    console.log('🗺️ Requesting location permission...');
    
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('❌ Location permission denied');
      Alert.alert(
        'Location Permission Required',
        'Please enable location services to see your current position and get directions to branches.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return null;
    }

    console.log('✅ Location permission granted');
    
    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 1000,
      distanceInterval: 10
    });

    userLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy
    };
    isLocationInitialized = true;

    console.log('📍 User location obtained:', userLocation);
    return userLocation;

  } catch (error) {
    console.error('❌ Error getting user location:', error);
    Alert.alert(
      'Location Error',
      'Unable to get your current location. Please check your location settings and try again.'
    );
    return null;
  }
};

/**
 * Start watching user location for real-time updates
 */
export const startLocationTracking = async (onLocationUpdate) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    console.log('🔄 Starting location tracking...');

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update when moved 10 meters
      },
      (location) => {
        userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy
        };
        isLocationInitialized = true;
        
        console.log('📍 Location updated:', userLocation);
        onLocationUpdate(userLocation);
      }
    );

    return locationSubscription;

  } catch (error) {
    console.error('❌ Error starting location tracking:', error);
    return null;
  }
};

/**
 * Stop location tracking
 */
export const stopLocationTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
    console.log('⏹️ Location tracking stopped');
  }
};

/**
 * Get current user location (cached)
 */
export const getCurrentUserLocation = () => {
  return userLocation;
};

/**
 * Calculate distance between two coordinates (in km)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

/**
 * Find nearest branch to user location
 */
export const findNearestBranch = (userLat, userLon, branches) => {
  if (!userLat || !userLon || !branches) return null;

  let nearestBranch = null;
  let shortestDistance = Infinity;

  branches.forEach(branch => {
    const distance = calculateDistance(userLat, userLon, branch.latitude, branch.longitude);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestBranch = { ...branch, distance };
    }
  });

  return nearestBranch;
};

/**
 * Generate route coordinates between two points (simplified polyline)
 */
export const generateRouteCoordinates = (startLat, startLon, endLat, endLon) => {
  // Simple straight line route (for basic visualization)
  // In a real app, you'd use Google Directions API or similar
  
  const coordinates = [];
  const steps = 20; // Number of points in the line
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = startLat + (endLat - startLat) * ratio;
    const lon = startLon + (endLon - startLon) * ratio;
    coordinates.push({ latitude: lat, longitude: lon });
  }
  
  return coordinates;
};

/**
 * Get directions to a branch (opens external map app)
 */
export const getDirectionsToBranch = async (branch) => {
  try {
    const userLoc = await getUserLocation();
    if (!userLoc) {
      Alert.alert('Location Required', 'Please enable location services to get directions.');
      return;
    }

    const destination = `${branch.latitude},${branch.longitude}`;
    const origin = `${userLoc.latitude},${userLoc.longitude}`;

    // Choose the appropriate map app based on platform
    let url;
    
    if (Platform.OS === 'ios') {
      // Apple Maps
      url = `maps://app?saddr=${origin}&daddr=${destination}&dirflg=d`;
    } else {
      // Google Maps
      url = `google.navigation:q=${destination}&mode=d`;
    }

    console.log('🧭 Opening directions to:', branch.title);
    console.log('📍 URL:', url);

    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback to web-based Google Maps
      const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      await Linking.openURL(webUrl);
    }

  } catch (error) {
    console.error('❌ Error opening directions:', error);
    Alert.alert('Error', 'Unable to open directions. Please try again.');
  }
};

/**
 * Get detailed route from OpenRouteService API (FREE - no billing required)
 */
export const getDetailedRoute = async (startLat, startLon, endLat, endLon, mode = 'driving-car') => {
  try {
    // Check if API key is available
    if (!OPENROUTE_API_KEY) {
      console.log('🔄 No OpenRouteService API key found, using fallback route...');
      return getFallbackRoute(startLat, startLon, endLat, endLon);
    }

    const coordinates = [[startLon, startLat], [endLon, endLat]]; // Note: lon,lat format for OpenRouteService
    
    const url = 'https://api.openrouteservice.org/v2/directions/' + mode;
    
    console.log('🛣️ Fetching directions from OpenRouteService...');
    
    const requestBody = {
      coordinates: coordinates,
      format: 'json',
      instructions: true,
      geometry: true,
      elevation: false
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Authorization': OPENROUTE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouteService API error:', response.status, errorText);
      throw new Error(`OpenRouteService API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      console.error('❌ No routes found in API response');
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    
    // Convert OpenRouteService geometry to coordinates
    let routeCoordinates = [];
    
    if (route.geometry) {
      if (typeof route.geometry === 'string') {
        // Handle encoded polyline string (Standard for ORS JSON responses)
        routeCoordinates = decodePolyline(route.geometry);
        console.log('✅ Decoded polyline string:', routeCoordinates.length, 'points');
      }
      else if (route.geometry.type === 'LineString' && route.geometry.coordinates) {
        // Handle GeoJSON format
        routeCoordinates = route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));
        console.log('✅ Processed GeoJSON LineString:', routeCoordinates.length, 'points');
      }
      else if (Array.isArray(route.geometry.coordinates)) {
        // Handle array format
        routeCoordinates = route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));
        console.log('✅ Processed coordinate array:', routeCoordinates.length, 'points');
      }
    } 
    
    if (routeCoordinates.length === 0) {
      throw new Error('Failed to extract route coordinates');
    }
    
    console.log(`✅ Route decoded successfully with ${routeCoordinates.length} points`);

    // Extract turn-by-turn directions
    let steps = [];
    
    if (route.segments && route.segments.length > 0 && route.segments[0].steps) {
      steps = route.segments[0].steps.map((step, index) => ({
        id: index,
        instruction: step.instruction || 'Continue',
        distance: `${(step.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(step.duration / 60)} min`,
        coordinates: routeCoordinates.slice(
          step.way_points?.[0] || 0, 
          (step.way_points?.[1] || 0) + 1
        ),
        startLocation: {
          lat: routeCoordinates[step.way_points?.[0] || 0]?.latitude,
          lng: routeCoordinates[step.way_points?.[0] || 0]?.longitude
        },
        endLocation: {
          lat: routeCoordinates[step.way_points?.[1] || routeCoordinates.length - 1]?.latitude,
          lng: routeCoordinates[step.way_points?.[1] || routeCoordinates.length - 1]?.longitude
        },
        maneuver: getManeuverFromInstruction(step.instruction || 'straight')
      }));
      console.log('✅ Created', steps.length, 'navigation steps');
    } else {
      // Fallback steps creation
      const totalDistance = route.summary?.distance || 1000;
      const totalDuration = route.summary?.duration || 300;
      
      steps = [
        {
          id: 0,
          instruction: 'Head towards your destination',
          distance: `${(totalDistance / 1000).toFixed(1)} km`,
          duration: `${Math.round(totalDuration / 60)} min`,
          coordinates: routeCoordinates,
          startLocation: {
            lat: routeCoordinates[0]?.latitude,
            lng: routeCoordinates[0]?.longitude
          },
          endLocation: {
            lat: routeCoordinates[routeCoordinates.length - 1]?.latitude,
            lng: routeCoordinates[routeCoordinates.length - 1]?.longitude
          },
          maneuver: 'straight'
        },
        {
          id: 1,
          instruction: 'You have arrived at your destination',
          distance: '0 km',
          duration: '0 min',
          coordinates: [{ latitude: endLat, longitude: endLon }],
          startLocation: {
            lat: routeCoordinates[routeCoordinates.length - 1]?.latitude,
            lng: routeCoordinates[routeCoordinates.length - 1]?.longitude
          },
          endLocation: {
            lat: routeCoordinates[routeCoordinates.length - 1]?.latitude,
            lng: routeCoordinates[routeCoordinates.length - 1]?.longitude
          },
          maneuver: 'arrive'
        }
      ];
      console.log('✅ Created basic navigation steps');
    }
    
    return {
      coordinates: routeCoordinates,
      steps: steps,
      distance: route.summary ? `${(route.summary.distance / 1000).toFixed(1)} km` : 'Unknown',
      duration: route.summary ? `${Math.round(route.summary.duration / 60)} min` : 'Unknown',
      startAddress: `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`,
      endAddress: `${endLat.toFixed(4)}, ${endLon.toFixed(4)}`,
      isRealRoute: true
    };
    
  } catch (error) {
    console.error('❌ Error in getDetailedRoute:', error.message);
    return getFallbackRoute(startLat, startLon, endLat, endLon);
  }
};

/**
 * HELPER: Parse instruction text to maneuver type with left/right directions
 */
const getManeuverFromInstruction = (instruction) => {
  if (!instruction) return 'straight';
  const text = instruction.toLowerCase();
  
  // Enhanced direction parsing for left/right
  if (text.includes('turn left') || text.includes('left turn')) return 'turn-left';
  if (text.includes('turn right') || text.includes('right turn')) return 'turn-right';
  if (text.includes('bear left') || text.includes('slight left')) return 'turn-slight-left';
  if (text.includes('bear right') || text.includes('slight right')) return 'turn-slight-right';
  if (text.includes('sharp left')) return 'turn-sharp-left';
  if (text.includes('sharp right')) return 'turn-sharp-right';
  
  // Convert compass directions to left/right
  if (text.includes('north') && (text.includes('west') || text.includes('left'))) return 'turn-left';
  if (text.includes('north') && (text.includes('east') || text.includes('right'))) return 'turn-right';
  if (text.includes('south') && (text.includes('west') || text.includes('left'))) return 'turn-left';
  if (text.includes('south') && (text.includes('east') || text.includes('right'))) return 'turn-right';
  if (text.includes('east') && text.includes('north')) return 'turn-right';
  if (text.includes('west') && text.includes('north')) return 'turn-left';
  
  // Fallback compass to left/right conversion
  if (text.includes('east')) return 'turn-right';
  if (text.includes('west')) return 'turn-left';
  
  if (text.includes('uturn') || text.includes('u-turn')) return 'u-turn';
  if (text.includes('roundabout')) return 'roundabout';
  if (text.includes('arrive') || text.includes('destination')) return 'arrive';
  if (text.includes('straight') || text.includes('continue')) return 'straight';
  if (text.includes('exit')) return 'ramp-right';
  if (text.includes('merge')) return 'merge';
  
  return 'straight';
};

/**
 * HELPER: Create a unique key for caching routes
 */
const getCacheKey = (startLat, startLon, endLat, endLon, mode = 'driving-car') => {
  // Round to 3 decimal places for consistent caching (approx 111m precision)
  const sLat = parseFloat(startLat).toFixed(3);
  const sLon = parseFloat(startLon).toFixed(3);
  const eLat = parseFloat(endLat).toFixed(3);
  const eLon = parseFloat(endLon).toFixed(3);
  return `${sLat},${sLon}-${eLat},${eLon}-${mode}`;
};

/**
 * Get cached route or fetch new one - IMPROVED caching
 */
export const getCachedRoute = async (startLat, startLon, endLat, endLon, mode = 'driving-car') => {
  const cacheKey = getCacheKey(startLat, startLon, endLat, endLon, mode);
  
  // Check if route exists in cache
  if (routeCache.has(cacheKey)) {
    const cachedRoute = routeCache.get(cacheKey);
    console.log('⚡ INSTANT: Using cached route for:', cacheKey);
    return cachedRoute;
  }
  
  // Fetch new route and cache it
  console.log('🔄 Fetching and caching new route for:', cacheKey);
  const routeData = await getDetailedRoute(startLat, startLon, endLat, endLon, mode);
  
  if (routeData && routeData.coordinates) {
    // Store in cache with timestamp
    const cacheEntry = {
      ...routeData,
      cachedAt: Date.now(),
      cacheKey
    };
    routeCache.set(cacheKey, cacheEntry);
    console.log('✅ Route cached successfully:', cacheKey, `(${routeData.coordinates.length} points)`);
  } else {
    console.log('⚠️ Failed to cache route:', cacheKey);
  }
  
  return routeData;
};

/**
 * Preload everything for branches screen - ENHANCED
 */
export const preloadBranchesData = async (branches) => {
  console.log('🚀 AGGRESSIVE preloading of branches data...');
  
  // Ensure location is ready
  const location = await getUserLocationInstant();
  if (!location) {
    console.log('⚠️ No location available for preloading');
    return false;
  }

  console.log('📍 Preloading from location:', location);

  // Preload all routes with detailed logging
  const preloadPromises = branches.map(async (branch, index) => {
    try {
      console.log(`🔄 [${index + 1}/${branches.length}] Starting preload: ${branch.title}`);
      
      const routeData = await getCachedRoute(
        location.latitude,
        location.longitude,
        branch.latitude,
        branch.longitude
      );
      
      if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
        console.log(`✅ [${index + 1}/${branches.length}] Preloaded: ${branch.title} - ${routeData.coordinates.length} points cached`);
        return { success: true, branch: branch.title };
      } else {
        console.log(`❌ [${index + 1}/${branches.length}] Failed: ${branch.title} - no route data`);
        return { success: false, branch: branch.title };
      }
    } catch (error) {
      console.log(`❌ [${index + 1}/${branches.length}] Error preloading ${branch.title}:`, error.message);
      return { success: false, branch: branch.title, error: error.message };
    }
  });

  const results = await Promise.allSettled(preloadPromises);
  const successful = results.filter(r => r.value?.success).length;
  
  console.log(`🎯 Preload summary: ${successful}/${branches.length} routes cached`);
  console.log('📊 Current cache size:', routeCache.size, 'routes');
  
  // Log all cached routes for debugging
  console.log('📋 Cached routes:');
  for (const [key, value] of routeCache.entries()) {
    console.log(`  - ${key}: ${value.coordinates?.length || 0} points`);
  }
  
  return successful > 0;
};

/**
 * Generate fallback route structure
 */
const getFallbackRoute = (startLat, startLon, endLat, endLon) => {
  console.log('🔄 Generating fallback straight-line route');
  const coordinates = generateRouteCoordinates(startLat, startLon, endLat, endLon);
  const distance = calculateDistance(startLat, startLon, endLat, endLon);
  const estimatedTime = Math.round(distance * 2); // Rough estimate: 2 minutes per km
  
  return {
    coordinates,
    steps: [
      {
        id: 0,
        instruction: `Head towards destination (${distance.toFixed(1)} km away)`,
        distance: `${distance.toFixed(1)} km`,
        duration: `${estimatedTime} min`,
        coordinates: coordinates,
        startLocation: { lat: startLat, lng: startLon },
        endLocation: { lat: endLat, lng: endLon },
        maneuver: 'straight'
      },
      {
        id: 1,
        instruction: 'You have arrived at your destination',
        distance: '0 km',
        duration: '0 min',
        coordinates: [{ latitude: endLat, longitude: endLon }],
        startLocation: { lat: endLat, lng: endLon },
        endLocation: { lat: endLat, lng: endLon },
        maneuver: 'arrive'
      }
    ],
    distance: `${distance.toFixed(1)} km`,
    duration: `${estimatedTime} min`,
    startAddress: `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`,
    endAddress: `${endLat.toFixed(4)}, ${endLon.toFixed(4)}`,
    isFallback: true
  };
};

/**
 * Start in-app navigation to a branch - OPTIMIZED to use cached data
 */
export const startInAppNavigation = async (branch) => {
  try {
    // Use instant location (from cache, no API call)
    const userLoc = await getUserLocationInstant();
    if (!userLoc) {
      Alert.alert('Location Required', 'Please enable location services to start navigation.');
      return null;
    }

    console.log('🧭 Starting in-app navigation to:', branch.title);
    
    // Use cached route data (no API call)
    const routeData = await getCachedRoute(
      userLoc.latitude,
      userLoc.longitude,
      branch.latitude,
      branch.longitude
    );
    
    return {
      ...routeData,
      destination: branch,
      userLocation: userLoc
    };
    
  } catch (error) {
    console.error('❌ Error starting navigation:', error);
    Alert.alert('Navigation Error', 'Unable to start navigation. Please try again.');
    return null;
  }
};

/**
 * Enhanced navigation step calculation with distance-based progress
 */
export const getCurrentNavigationStep = (userLat, userLon, steps) => {
  if (!steps || steps.length === 0) return null;
  
  let closestStepIndex = 0;
  let shortestDistance = Infinity;
  
  // Find the closest upcoming step
  steps.forEach((step, index) => {
    const distanceToStepStart = calculateDistance(
      userLat, 
      userLon, 
      step.startLocation.lat, 
      step.startLocation.lng
    );
    
    // Check if this step is closer and still ahead
    if (distanceToStepStart < shortestDistance) {
      shortestDistance = distanceToStepStart;
      closestStepIndex = index;
    }
  });
  
  // Calculate progress based on distance to destination
  const totalSteps = steps.length;
  const progressPercentage = ((closestStepIndex + 1) / totalSteps) * 100;
  
  return {
    currentStep: steps[closestStepIndex],
    currentStepIndex: closestStepIndex,
    nextStep: steps[closestStepIndex + 1] || null,
    progress: Math.min(100, Math.max(0, progressPercentage)),
    distanceToStep: shortestDistance
  };
};

/**
 * Check if user has arrived at destination
 */
export const checkArrival = (userLat, userLon, destinationLat, destinationLon, threshold = 0.05) => {
  const distance = calculateDistance(userLat, userLon, destinationLat, destinationLon);
  return distance <= threshold; // Within 50 meters
};

/**
 * Get map region that includes both user location and selected branch
 */
export const getRegionForUserAndBranch = (branch) => {
  if (!userLocation) return null;

  const lats = [userLocation.latitude, branch.latitude];
  const lngs = [userLocation.longitude, branch.longitude];

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;

  const latitudeDelta = Math.max(0.05, (maxLat - minLat) * 1.5);
  const longitudeDelta = Math.max(0.05, (maxLng - minLng) * 1.5);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
};

/**
 * Main hook/function to use in your map component
 */
export const useMapLocation = () => {
  return {
    // Core functions
    getUserLocation,
    getUserLocationInstant,
    initializeLocationInBackground,
    preloadBranchesData,
    startLocationTracking,
    stopLocationTracking,
    getCurrentUserLocation,
    
    // Branch functions
    findNearestBranch,
    getDirectionsToBranch,
    
    // Route functions
    generateRouteCoordinates,
    getRegionForUserAndBranch,
    
    // In-app navigation functions
    getDetailedRoute,
    getCachedRoute,
    startInAppNavigation,
    getCurrentNavigationStep,
    checkArrival,
    
    // Utilities
    calculateDistance,
  };
};

const decodePolyline = (encoded) => {
  if (!encoded) return [];
  
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }

  return points;
};