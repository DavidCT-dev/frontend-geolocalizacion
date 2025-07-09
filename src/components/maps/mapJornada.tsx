'use client';
import React, { useRef, useEffect, useState } from 'react';
import { LoadScript, GoogleMap, Polyline, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface Point {
  latitud: number;
  longitud: number;
}

interface MapProps {
  routePoints: Point[];
  alternativeRoutePoints: Point[];
  showAlternative: boolean;
  center: Point;
  ubicacionActual: Point | null;
  routeName: string;
  routeType: string;
}

const MapJornada: React.FC<MapProps> = ({
  routePoints = [],
  alternativeRoutePoints = [],
  showAlternative = false,
  center,
  ubicacionActual = null,
  routeName = '',
  routeType = ''
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setIsLoaded(true);
  };

  const onUnmount = () => {
    mapRef.current = null;
    markerRef.current = null;
    setIsLoaded(false);
  };

  // Determinar qué ruta mostrar
  const activeRoute = showAlternative ? alternativeRoutePoints : routePoints;
  const activeRoutePath = activeRoute.map(point => ({
    lat: point.latitud,
    lng: point.longitud
  }));

  // Configuración del ícono para la ubicación actual
  const locationIcon = {
    path: 0, // Equivalente a google.maps.SymbolPath.CIRCLE
    scale: 8,
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#FFFFFF'
  };

  useEffect(() => {
    if (mapRef.current && activeRoute.length > 0) {
      const bounds = new google.maps.LatLngBounds();

      // Añadir puntos de la ruta a los límites
      activeRoute.forEach(point => {
        bounds.extend(new google.maps.LatLng(point.latitud, point.longitud));
      });

      // Añadir ubicación actual a los límites si existe
      if (ubicacionActual) {
        bounds.extend(new google.maps.LatLng(ubicacionActual.latitud, ubicacionActual.longitud));
      }

      // Ajustar el mapa a los límites calculados
      mapRef.current.fitBounds(bounds);

      // Limitar el zoom máximo
      const listener = google.maps.event.addListener(mapRef.current, 'bounds_changed', () => {
        if (mapRef.current) {
          const currentZoom = mapRef.current.getZoom();
          if (currentZoom && currentZoom > 15) {
            mapRef.current.setZoom(15);
          }
        }
      });

      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [activeRoute, ubicacionActual]);

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      loadingElement={<div style={{ height: '100%' }} />}
      onLoad={() => setIsLoaded(true)}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={ubicacionActual ?
          { lat: ubicacionActual.latitud, lng: ubicacionActual.longitud } :
          { lat: center.latitud, lng: center.longitud }}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          minZoom: 10,
          maxZoom: 18
        }}
      >
        {/* Ruta principal o alternativa */}
        {activeRoutePath.length > 1 && (
          <Polyline
            path={activeRoutePath}
            options={{
              strokeColor: showAlternative ? '#0000FF' : '#FF0000',
              strokeOpacity: 1.0,
              strokeWeight: 4,
              zIndex: 1
            }}
          />
        )}

        {/* Marcador de ubicación actual */}
        {ubicacionActual && (
          <Marker
            position={{
              lat: ubicacionActual.latitud,
              lng: ubicacionActual.longitud
            }}
            icon={locationIcon}
            zIndex={10}
          />
        )}

        {/* Marcadores de inicio y fin de ruta */}
        {activeRoutePath.length > 0 && isLoaded && (
          <>
            {/* <Marker
              position={activeRoutePath[0]}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              }}
              label="Inicio"
            /> */}
            {/* <Marker
              position={activeRoutePath[activeRoutePath.length - 1]}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              }}
              label="Fin"
            /> */}
          </>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapJornada;
