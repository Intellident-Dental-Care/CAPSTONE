import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useMapLocation } from "../../server/userMapLocation";
import { preloadLocationData, isLocationPreloaded } from "../_storage/locationPreload";

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

export default function Branches() {
  const router = useRouter();
  const mapLocation = useMapLocation();
  
  // Map state
  const [userLocation, setUserLocation] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [mapRef, setMapRef] = useState(null);
  
  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationData, setNavigationData] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);

  const initialRegion = useMemo(() => {
    const lats = BRANCHES.map((b) => b.latitude);
    const lngs = BRANCHES.map((b) => b.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;

    const latitudeDelta = Math.max(0.18, (maxLat - minLat) + 0.12);
    const longitudeDelta = Math.max(0.18, (maxLng - minLng) + 0.12);

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  }, []);

  // Optimized initialization - uses preloaded data
  useEffect(() => {
    const initializeInstantly = async () => {
      console.log('⚡ Initializing branches screen...');
      
      // Ensure preloading is complete
      if (!isLocationPreloaded()) {
        console.log('🔄 Preload not complete, triggering now...');
        await preloadLocationData();
      }
      
      // Get location from cache (no API call)
      const location = await mapLocation.getUserLocationInstant();
      if (location) {
        setUserLocation(location);
        console.log('✅ Using cached location instantly');
      }
      
      // Start location tracking for real-time updates only
      mapLocation.startLocationTracking((loc) => {
        setUserLocation(loc);
        if (isNavigating && navigationData?.steps) {
          updateNavigationState(loc);
        }
      });

      console.log('🎯 Branches screen ready with preloaded data');
    };

    initializeInstantly();
    return () => mapLocation.stopLocationTracking();
  }, [isNavigating, navigationData]);

  const updateNavigationState = (location) => {
    const stepInfo = mapLocation.getCurrentNavigationStep(
      location.latitude, location.longitude, navigationData.steps
    );
    setCurrentStep(stepInfo);
    
    // Check if arrived
    const arrived = mapLocation.checkArrival(
      location.latitude,
      location.longitude,
      navigationData.destination.latitude,
      navigationData.destination.longitude
    );
    
    if (arrived) {
      handleArrival();
    }
    
    if (mapRef) {
      mapRef.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01, // Zoomed closer for navigation
        longitudeDelta: 0.01
      }, 1000);
    }
  };

  // Super optimized marker press - should be INSTANT now
  const onMarkerPress = async (branch) => {
    if (isNavigating) return;
    
    console.log('📍 Branch selected:', branch.title);
    
    // 1. Update UI immediately
    setSelectedBranch(branch);
    
    // 2. Get user location instantly (from cache)
    const currentLocation = userLocation || await mapLocation.getUserLocationInstant();
    if (!currentLocation) {
      console.log('⚠️ No location available');
      return;
    }

    try {
      // 3. Get cached route (should be INSTANT due to preloading)
      console.log('⚡ Getting cached route instantly...');
      const routeData = await mapLocation.getCachedRoute(
        currentLocation.latitude, 
        currentLocation.longitude,
        branch.latitude, 
        branch.longitude
      );
      
      if (routeData && routeData.coordinates) {
        console.log('⚡ Route loaded from cache instantly:', routeData.coordinates.length, 'points');
        setRouteCoordinates(routeData.coordinates);
        
        // Animate to show route
        if (mapRef && routeData.coordinates.length > 0) {
          setTimeout(() => {
            mapRef.fitToCoordinates(routeData.coordinates, {
              edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
              animated: true
            });
          }, 50);
        }
      } else {
        console.log('⚠️ No cached route found, using fallback');
        // Fallback to straight line
        const route = mapLocation.generateRouteCoordinates(
          currentLocation.latitude, 
          currentLocation.longitude,
          branch.latitude, 
          branch.longitude
        );
        setRouteCoordinates(route);
      }
      
    } catch (error) {
      console.error('❌ Route error:', error);
      // Fallback route
      const route = mapLocation.generateRouteCoordinates(
        currentLocation.latitude, 
        currentLocation.longitude,
        branch.latitude, 
        branch.longitude
      );
      setRouteCoordinates(route);
    }
  };

  // Instant navigation start
  const handleDirections = async () => {
    if (!selectedBranch) return;
    
    // Reuse the already-rendered location first, then fall back to shared cache/service.
    const currentLocation =
      userLocation ||
      mapLocation.getCurrentUserLocation() ||
      await mapLocation.getUserLocationInstant();

    if (!currentLocation) {
      console.log('⚠️ No location for navigation');
      return;
    }
    
    console.log('🧭 Starting instant navigation...');
    
    try {
      const routeData = await mapLocation.getCachedRoute(
        currentLocation.latitude,
        currentLocation.longitude,
        selectedBranch.latitude,
        selectedBranch.longitude
      );
      
      if (routeData) {
        setNavigationData({
          ...routeData,
          destination: selectedBranch
        });
        
        setIsNavigating(true);
        
        // Initialize navigation step
        if (routeData.steps && routeData.steps.length > 0) {
          const stepInfo = mapLocation.getCurrentNavigationStep(
            currentLocation.latitude,
            currentLocation.longitude,
            routeData.steps
          );
          setCurrentStep(stepInfo);
        }
        
        // Zoom to navigation view
        if (mapRef) {
          mapRef.animateToRegion({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          }, 600);
        }
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  // Stop navigation mode
  const stopNavigation = () => {
    console.log('⏹️ Stopping navigation mode...');
    
    setIsNavigating(false);
    setNavigationData(null);
    setCurrentStep(null);
    
    // Reset to overview mode
    setTimeout(() => {
      if (mapRef) {
        if (routeCoordinates.length > 0) {
          // Show the full route
          mapRef.fitToCoordinates(routeCoordinates, {
            edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
            animated: true
          });
        } else {
          // Return to initial region
          mapRef.animateToRegion(initialRegion, 1000);
        }
      }
    }, 300);
  };

  // Handle arrival
  const handleArrival = () => {
    console.log('🎯 Arrived at destination!');
    // Auto-stop navigation after arrival
    setTimeout(() => {
      stopNavigation();
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Navigation Header (only show when navigating) */}
      {isNavigating ? (
        <View style={styles.navHeader}>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>{navigationData?.destination?.title}</Text>
            <Text style={styles.navSubtitle}>
              {navigationData?.distance} • {navigationData?.duration}
            </Text>
          </View>
          
          <Pressable style={styles.stopNavBtn} onPress={stopNavigation}>
            <Ionicons name="close" size={20} color="white" />
          </Pressable>
        </View>
      ) : (
        // Regular Header
        <>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>

          <Text style={styles.title}>GC Dental Branches</Text>
          <Text style={styles.subtitle}>
            {userLocation 
              ? "Tap a branch for instant directions" 
              : "Enable location for navigation"
            }
          </Text>
        </>
      )}

      {/* Map container */}
      <View style={[styles.mapWrap, isNavigating && styles.mapFullScreen]}>
        <MapView 
          ref={setMapRef}
          style={StyleSheet.absoluteFill} 
          initialRegion={initialRegion}
          showsUserLocation={false} // Use custom marker for better control
          showsMyLocationButton={false}
          followsUserLocation={isNavigating}
          showsCompass={isNavigating}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker coordinate={userLocation} title="Your Location">
              <View style={[
                styles.userMarker,
                isNavigating && styles.navUserMarker
              ]}>
                <Ionicons 
                  name={isNavigating ? "navigate" : "person"} 
                  size={isNavigating ? 20 : 16} 
                  color="white" 
                />
              </View>
            </Marker>
          )}

          {/* Branch markers */}
          {BRANCHES.map((branch) => {
            // Hide other branches during navigation
            if (isNavigating && branch.key !== navigationData?.destination?.key) {
              return null;
            }
            
            return (
              <Marker
                key={branch.key}
                coordinate={{ latitude: branch.latitude, longitude: branch.longitude }}
                title={branch.title}
                description={branch.description}
                pinColor={selectedBranch?.key === branch.key ? colors.primary : "#FF6B6B"}
                onPress={() => onMarkerPress(branch)}
              >
                {isNavigating && branch.key === navigationData?.destination?.key && (
                  <View style={styles.destinationMarker}>
                    <Ionicons name="flag" size={20} color="white" />
                  </View>
                )}
              </Marker>
            );
          })}

          {/* Route line */}
          {routeCoordinates.length > 0 && (
            <Polyline 
              coordinates={routeCoordinates}
              strokeColor={isNavigating ? "#4285F4" : colors.primary}
              strokeWidth={isNavigating ? 5 : 4}
              strokePattern={isNavigating ? [] : [5, 5]}
            />
          )}
        </MapView>

        {/* Navigation instruction overlay with improved directions */}
        {isNavigating && currentStep && (
          <View style={styles.instructionOverlay}>
            <View style={styles.maneuverContainer}>
              <View style={styles.maneuverIcon}>
                <Ionicons 
                  name={getManeuverIcon(currentStep.currentStep.maneuver)} 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.instructionText}>
                <Text style={styles.instruction}>
                  {currentStep.currentStep.instruction}
                </Text>
                <Text style={styles.instructionDistance}>
                  in {currentStep.currentStep.distance}
                </Text>
              </View>
            </View>
            
            {/* Next instruction preview */}
            {currentStep.nextStep && (
              <View style={styles.nextInstructionContainer}>
                <Text style={styles.nextInstructionLabel}>Then:</Text>
                <Text style={styles.nextInstruction} numberOfLines={1}>
                  {currentStep.nextStep.instruction}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Location status overlay (only when not navigating) */}
        {!isNavigating && (
          <View style={styles.statusOverlay}>
            <View style={[styles.statusDot, { backgroundColor: userLocation ? '#4CAF50' : '#FFC107' }]} />
            <Text style={styles.statusText}>
              {userLocation ? 'Location Active' : 'Enable Location'}
            </Text>
          </View>
        )}

        {/* Selected branch info with instant feedback */}
        {!isNavigating && selectedBranch && (
          <View style={styles.selectedBranchCard}>
            <View style={styles.branchInfo}>
              <Text style={styles.branchTitle}>{selectedBranch.title}</Text>
              <Text style={styles.branchDesc}>{selectedBranch.description}</Text>
              {userLocation && (
                <Text style={styles.branchDistance}>
                  {mapLocation.calculateDistance(
                    userLocation.latitude, 
                    userLocation.longitude,
                    selectedBranch.latitude, 
                    selectedBranch.longitude
                  ).toFixed(1)} km away
                </Text>
              )}
            </View>
            
            <Pressable 
              style={styles.directionsBtn} 
              onPress={handleDirections}
              disabled={!userLocation}
            >
              <Ionicons 
                name="navigate" 
                size={20} 
                color={userLocation ? "white" : colors.textGray} 
              />
              <Text style={[styles.directionsBtnText, { 
                color: userLocation ? "white" : colors.textGray 
              }]}>
                {userLocation ? 'Navigate' : 'Enable Location'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

// Helper function to get maneuver icons
const getManeuverIcon = (maneuver) => {
  const iconMap = {
    'turn-left': 'arrow-back',
    'turn-right': 'arrow-forward',
    'straight': 'arrow-up',
    'u-turn': 'return-up-back',
    'roundabout': 'refresh',
    'arrive': 'flag',
    'ramp-right': 'arrow-forward',
    'ramp-left': 'arrow-back',
    'merge': 'arrow-up'
  };
  
  return iconMap[maneuver] || 'arrow-up';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 46,
    alignItems: "center",
  },

  backBtn: {
    position: "absolute",
    left: 14,
    top: 46,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 10,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 14,
  },

  mapWrap: {
    marginTop: 18,
    width: "86%",
    height: "85%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f2f2f2",
  },

  mapFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },

  mapFallbackText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 8,
  },

  mapFallbackSubtext: {
    fontSize: 14,
    color: colors.textGray,
  },

  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },

  statusOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textGray,
  },

  selectedBranchCard: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  branchInfo: {
    flex: 1,
  },

  branchTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
  },

  branchDesc: {
    fontSize: 10,
    color: colors.textGray,
    marginTop: 2,
  },

  branchDistance: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },

  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },

  directionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  mapFullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    marginTop: 0,
    borderRadius: 0,
  },

  navHeader: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  navInfo: {
    flex: 1,
  },

  navTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: 'white',
  },

  navSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  stopNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navUserMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: 'white',
  },

  destinationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  instructionOverlay: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  maneuverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  maneuverIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE9F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  instructionText: {
    flex: 1,
  },

  instruction: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    lineHeight: 20,
  },

  instructionDistance: {
    fontSize: 14,
    color: colors.textGray,
    marginTop: 2,
    fontWeight: '700',
  },

  nextInstructionContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  nextInstructionLabel: {
    fontSize: 11,
    color: colors.textGray,
    fontWeight: '600',
  },

  nextInstruction: {
    fontSize: 11,
    color: colors.textGray,
    flex: 1,
  },
});

// Custom pin styles
styles.branchPin = {
  alignItems: 'center',
  justifyContent: 'center',
};

styles.branchPinInner = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'white',
  borderWidth: 3,
  borderColor: colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,
};

styles.selectedBranchPin = {
  // Container styling for selected state
};

styles.selectedBranchPinInner = {
  backgroundColor: colors.primary,
  borderColor: 'white',
  transform: [{ scale: 1.1 }],
};

styles.branchPinTail = {
  width: 0,
  height: 0,
  backgroundColor: 'transparent',
  borderStyle: 'solid',
  borderTopWidth: 8,
  borderRightWidth: 6,
  borderBottomWidth: 0,
  borderLeftWidth: 6,
  borderTopColor: colors.primary,
  borderRightColor: 'transparent',
  borderBottomColor: 'transparent',
  borderLeftColor: 'transparent',
  marginTop: -2,
};

styles.selectedBranchPinTail = {
  borderTopColor: colors.primary,
};

styles.destinationFlag = {
  position: 'absolute',
  top: -8,
  right: -8,
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: '#4CAF50',
  borderWidth: 2,
  borderColor: 'white',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: "#000",
  shadowOpacity: 0.3,
  shadowRadius: 2,
  elevation: 3,
};
