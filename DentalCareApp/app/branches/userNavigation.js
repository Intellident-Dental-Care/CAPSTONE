import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../theme/colors";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useMapLocation } from "../../server/userMapLocation";

export default function InAppNavigation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapLocation = useMapLocation();
  
  // Navigation state
  const [userLocation, setUserLocation] = useState(null);
  const [navigationData, setNavigationData] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [mapRef, setMapRef] = useState(null);

  // Get branch data from params
  const branch = params.branch ? JSON.parse(params.branch) : null;

  useEffect(() => {
    if (!branch) {
      Alert.alert('Error', 'No destination provided');
      router.back();
      return;
    }

    initializeNavigation();

    return () => {
      mapLocation.stopLocationTracking();
    };
  }, []);

  const initializeNavigation = async () => {
    try {
      console.log('🧭 Initializing navigation with cached data...');
      
      // Use cached navigation data (no API calls)
      const navData = await mapLocation.startInAppNavigation(branch);
      if (!navData) return;
      
      setNavigationData(navData);
      setIsNavigating(true);
      
      // Set initial user location from cached data
      setUserLocation(navData.userLocation);
      
      // Start real-time location tracking for interactive navigation
      mapLocation.startLocationTracking((location) => {
        setUserLocation(location);
        
        if (navData.steps) {
          // Update current step based on user's real position
          const stepInfo = mapLocation.getCurrentNavigationStep(
            location.latitude,
            location.longitude,
            navData.steps
          );
          setCurrentStep(stepInfo);
          
          // Dynamic arrival detection
          const arrived = mapLocation.checkArrival(
            location.latitude,
            location.longitude,
            navData.destination.latitude,
            navData.destination.longitude
          );
          
          if (arrived && !hasArrived) {
            setHasArrived(true);
            Alert.alert(
              'Arrived!',
              `You have arrived at ${navData.destination.title}`,
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }
        }
      });
      
      // Fit map to show cached route instantly
      if (mapRef && navData.coordinates) {
        setTimeout(() => {
          mapRef.fitToCoordinates(navData.coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
            animated: true
          });
        }, 500); // Reduced delay since data is cached
      }
      
    } catch (error) {
      console.error('Navigation initialization error:', error);
      Alert.alert('Error', 'Failed to start navigation');
    }
  };

  const stopNavigation = () => {
    Alert.alert(
      'Stop Navigation',
      'Are you sure you want to stop navigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            mapLocation.stopLocationTracking();
            router.back();
          }
        }
      ]
    );
  };

  const recenterMap = () => {
    if (mapRef && userLocation) {
      mapRef.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    }
  };

  if (!navigationData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Starting navigation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={setMapRef}
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker 
            coordinate={userLocation} 
            title="Your Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userMarker}>
              <Ionicons name="navigate" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Destination marker */}
        <Marker
          coordinate={{
            latitude: navigationData.destination.latitude,
            longitude: navigationData.destination.longitude
          }}
          title={navigationData.destination.title}
          description={navigationData.destination.description}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.destinationPin}>
            <View style={styles.destinationPinInner}>
              <Ionicons name="medical" size={16} color="white" />
            </View>
            <View style={styles.destinationPinTail} />
          </View>
        </Marker>

        {/* Route polyline */}
        {navigationData.coordinates && (
          <Polyline
            coordinates={navigationData.coordinates}
            strokeColor={colors.primary}
            strokeWidth={4}
            strokePattern={[10, 5]}
          />
        )}

        {/* Step markers - only show key navigation points to reduce clutter */}
        {navigationData.steps && navigationData.steps.slice(0, 3).map((step, index) => (
          <Marker
            key={`step-${step.id}`}
            coordinate={{
              latitude: step.startLocation.lat,
              longitude: step.startLocation.lng
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.stepMarker}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Navigation instruction panel */}
      <View style={styles.instructionPanel}>
        {currentStep && (
          <>
            <View style={styles.instructionRow}>
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
                <Text style={styles.distance}>
                  {currentStep.currentStep.distance} • {currentStep.currentStep.duration}
                </Text>
                {/* Show distance to current step for real-time feedback */}
                {currentStep.distanceToStep !== undefined && (
                  <Text style={styles.realTimeDistance}>
                    {(currentStep.distanceToStep * 1000).toFixed(0)}m to next step
                  </Text>
                )}
              </View>
            </View>

            {/* Dynamic progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progress, 
                    { width: `${currentStep.progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                Step {currentStep.currentStepIndex + 1} of {navigationData.steps.length} ({currentStep.progress.toFixed(0)}%)
              </Text>
            </View>

            {/* Next step preview */}
            {currentStep.nextStep && (
              <View style={styles.nextStepContainer}>
                <Text style={styles.nextStepLabel}>Then:</Text>
                <Text style={styles.nextStep} numberOfLines={1}>
                  {currentStep.nextStep.instruction}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Control buttons */}
      <View style={styles.controlButtons}>
        <Pressable style={styles.controlBtn} onPress={recenterMap}>
          <Ionicons name="locate" size={20} color={colors.primary} />
        </Pressable>

        <Pressable style={[styles.controlBtn, styles.stopBtn]} onPress={stopNavigation}>
          <Ionicons name="stop" size={20} color="white" />
        </Pressable>
      </View>

      {/* Trip info */}
      <View style={styles.tripInfo}>
        <View style={styles.tripInfoItem}>
          <Text style={styles.tripInfoLabel}>Distance</Text>
          <Text style={styles.tripInfoValue}>{navigationData.distance}</Text>
        </View>
        <View style={styles.tripInfoItem}>
          <Text style={styles.tripInfoLabel}>Time</Text>
          <Text style={styles.tripInfoValue}>{navigationData.duration}</Text>
        </View>
        <View style={styles.tripInfoItem}>
          <Text style={styles.tripInfoLabel}>Destination</Text>
          <Text style={styles.tripInfoValue} numberOfLines={1}>
            {navigationData.destination.title}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Helper function to get appropriate icons for maneuvers with left/right directions
const getManeuverIcon = (maneuver) => {
  const iconMap = {
    'turn-left': 'arrow-back',
    'turn-right': 'arrow-forward', 
    'turn-sharp-left': 'arrow-back',
    'turn-sharp-right': 'arrow-forward',
    'turn-slight-left': 'arrow-back',
    'turn-slight-right': 'arrow-forward',
    'straight': 'arrow-up',
    'ramp-left': 'arrow-back',
    'ramp-right': 'arrow-forward',
    'merge': 'arrow-up',
    'fork-left': 'arrow-back',
    'fork-right': 'arrow-forward',
    'ferry': 'boat',
    'ferry-train': 'train',
    'roundabout-left': 'refresh',
    'roundabout-right': 'refresh',
    'u-turn': 'return-up-back',
    'arrive': 'flag'
  };
  
  return iconMap[maneuver] || 'arrow-up';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  
  loadingText: {
    fontSize: 16,
    color: colors.textGray,
    fontWeight: '600'
  },
  
  map: {
    flex: 1
  },
  
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6
  },
  
  stepMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  stepNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary
  },
  
  instructionPanel: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  
  maneuverIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE9F1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  instructionText: {
    flex: 1
  },
  
  instruction: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    lineHeight: 20
  },
  
  distance: {
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2
  },
  
  realTimeDistance: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600'
  },
  
  progressContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2
  },
  
  progress: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2
  },
  
  progressText: {
    fontSize: 10,
    color: colors.textGray,
    fontWeight: '600'
  },
  
  nextStepContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  
  nextStepLabel: {
    fontSize: 11,
    color: colors.textGray,
    fontWeight: '600'
  },
  
  nextStep: {
    fontSize: 11,
    color: colors.textGray,
    flex: 1
  },
  
  controlButtons: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    gap: 12
  },
  
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  stopBtn: {
    backgroundColor: '#ff4444'
  },
  
  tripInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  tripInfoItem: {
    flex: 1,
    alignItems: 'center'
  },
  
  tripInfoLabel: {
    fontSize: 10,
    color: colors.textGray,
    fontWeight: '600'
  },
  
  tripInfoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 2
  },
  
  destinationPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  destinationPinInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  destinationPinTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 10,
    borderRightWidth: 7,
    borderBottomWidth: 0,
    borderLeftWidth: 7,
    borderTopColor: colors.primary,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    marginTop: -2,
  },
});
