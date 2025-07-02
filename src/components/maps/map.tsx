'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader
} from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = { lat: -19.5833, lng: -65.7500 };

const COLORES = {
  IDA: {
    principal: '#4285F4',
    alternativa: '#00BFFF',
  },
  VUELTA: {
    principal: '#EA4335',
    alternativa: '#FF6B6B',
  },
  PARADAS: '#34A853',
};

interface MapProps {
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  routePoints?: Array<{ latitud: number; longitud: number }>;
  alternativeRoute?: Array<{ latitud: number; longitud: number }>;
  stopPoints?: Array<{ nombre: string; latitud: number; longitud: number }>;
  mode?: 'ruta' | 'parada' | 'alternativa' | 'view';
  currentDirection?: 'ida' | 'vuelta';
}

export interface MapRef {
  panTo: (latLng: google.maps.LatLng | google.maps.LatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  clearMap: () => void;
  resetMap: () => void;
}

const Map = forwardRef<MapRef, MapProps>((
  {
    onMapClick,
    routePoints = [],
    alternativeRoute = [],
    stopPoints = [],
    mode = 'view',
    currentDirection = 'ida',
  },
  ref
) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['geometry']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [lastPoint, setLastPoint] = useState<{ lat: number, lng: number } | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const getMainRouteColor = () => {
    return currentDirection === 'ida' ? COLORES.IDA.principal : COLORES.VUELTA.principal;
  };

  const getAlternativeRouteColor = () => {
    return currentDirection === 'ida' ? COLORES.IDA.alternativa : COLORES.VUELTA.alternativa;
  };

  const clearOverlays = useCallback(() => {
    polylinesRef.current.forEach(polyline => polyline?.setMap(null));
    markersRef.current.forEach(marker => marker?.setMap(null));
    polylinesRef.current = [];
    markersRef.current = [];
  }, []);

  useEffect(() => {
    if (!map) return;

    if (routePoints.length > 0) {
      const last = routePoints[routePoints.length - 1];
      const newPoint = { lat: last.latitud, lng: last.longitud };

      if (!lastPoint || lastPoint.lat !== newPoint.lat || lastPoint.lng !== newPoint.lng) {
        setLastPoint(newPoint);
        map.panTo(newPoint);
        map.setZoom(17);
      }
    } else if (lastPoint !== null) {
      setLastPoint(null);
      map.panTo(defaultCenter);
      map.setZoom(14);
    }
  }, [routePoints, map, lastPoint]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    mapInstance.setMapTypeId('satellite');
    mapInstance.setOptions({
      styles: [
        {
          featureType: 'poi',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'road',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    });
  }, []);

  const onUnmount = useCallback(() => {
    clearOverlays();
    setMap(null);
  }, [clearOverlays]);

  useImperativeHandle(ref, () => ({
    resetMap: () => {
      clearOverlays();
      setRenderKey(prev => prev + 1);
    },
    panTo: (latLng) => map?.panTo(latLng),
    setZoom: (zoom) => map?.setZoom(zoom),
    clearMap: () => {
      clearOverlays();
      map?.panTo(defaultCenter);
      map?.setZoom(14);
      setLastPoint(null);
    },
  }));

  const getPolylineStyle = (isAlternative = false) => ({
    strokeColor: isAlternative ? getAlternativeRouteColor() : getMainRouteColor(),
    strokeOpacity: 0.9,
    strokeWeight: isAlternative ? 4 : 5,
    zIndex: 1
  });

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <GoogleMap
      key={`map-${renderKey}`}
      mapContainerStyle={containerStyle}
      center={lastPoint || defaultCenter}
      zoom={routePoints.length > 0 ? 17 : 14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={onMapClick}
      options={{
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        zoomControl: true,
        clickableIcons: false
      }}
    >
      {/* Ruta principal */}
      {routePoints.length > 1 && (
        <Polyline
          key={`polyline-main-${renderKey}`}
          path={routePoints.map(p => ({ lat: p.latitud, lng: p.longitud }))}
          options={getPolylineStyle()}
          onLoad={(polyline) => polylinesRef.current.push(polyline)}
        />
      )}

      {/* Ruta alternativa */}
      {alternativeRoute.length > 1 && (
        <Polyline
          key={`polyline-alt-${renderKey}`}
          path={alternativeRoute.map(p => ({ lat: p.latitud, lng: p.longitud }))}
          options={getPolylineStyle(true)}
          onLoad={(polyline) => polylinesRef.current.push(polyline)}
        />
      )}

      {/* Puntos de ruta principal */}
      {routePoints.map((point, index) => (
        <Marker
          key={`marker-main-${renderKey}-${index}`}
          position={{ lat: point.latitud, lng: point.longitud }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: getMainRouteColor(),
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#FFFFFF',
            scale: 6
          }}
          onLoad={(marker) => markersRef.current.push(marker)}
        />
      ))}

      {/* Puntos de ruta alternativa */}
      {alternativeRoute.map((point, index) => (
        <Marker
          key={`marker-alt-${renderKey}-${index}`}
          position={{ lat: point.latitud, lng: point.longitud }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: getAlternativeRouteColor(),
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#FFFFFF',
            scale: 5
          }}
          onLoad={(marker) => markersRef.current.push(marker)}
        />
      ))}

      {/* Paradas */}
      {stopPoints.map((stop, index) => (
        <Marker
          key={`marker-stop-${renderKey}-${index}`}
          position={{ lat: stop.latitud, lng: stop.longitud }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: COLORES.PARADAS,
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#FFFFFF',
            scale: 7
          }}
          label={{
            text: String(index + 1),
            color: '#FFFFFF',
            fontSize: '11px'
          }}
          title={stop.nombre}
          onLoad={(marker) => markersRef.current.push(marker)}
        />
      ))}

      {/* Último punto */}
      {lastPoint && (
        <Marker
          key={`marker-last-${renderKey}`}
          position={lastPoint}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: mode === 'alternativa' ? getAlternativeRouteColor() : getMainRouteColor(),
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
            scale: 8
          }}
          onLoad={(marker) => markersRef.current.push(marker)}
        />
      )}
    </GoogleMap>
  );
});

Map.displayName = 'MapComponent';
export default Map;
