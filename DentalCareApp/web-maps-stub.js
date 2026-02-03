// Web stub for react-native-maps to prevent bundling issues
import React from 'react';
import { View, Text } from 'react-native';

const MapView = ({ children, style, ...props }) => {
  return (
    <View 
      style={[
        { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
        style // Moves style second so user-defined styles can override defaults
      ]}
    >
      <Text style={{ fontSize: 16, color: '#666', fontWeight: 'bold' }}>Map View</Text>
      <Text style={{ fontSize: 12, color: '#999' }}>Web platform is not supported by react-native-maps</Text>
      
      {/* Render children so the app doesn't break if components are nested inside */}
      {children}
    </View>
  );
};

// Markers and other sub-components return null because they 
// usually require a native map engine to render visually.
const Marker = () => null;
const Callout = () => null;
const Polygon = () => null;
const Polyline = () => null;
const Circle = () => null;
const Overlay = () => null;
const UrlTile = () => null;
const Heatmap = () => null;

const PROVIDER_GOOGLE = 'google';
const PROVIDER_DEFAULT = 'default';

// Standard Map Types
const MAP_TYPES = {
  STANDARD: 'standard',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
  NONE: 'none',
  MUTEDSTANDARD: 'mutedStandard',
};

export { 
  Marker, 
  Callout, 
  Polygon, 
  Polyline, 
  Circle, 
  Overlay,
  UrlTile,
  Heatmap,
  PROVIDER_GOOGLE, 
  PROVIDER_DEFAULT,
  MAP_TYPES
};

export default MapView;