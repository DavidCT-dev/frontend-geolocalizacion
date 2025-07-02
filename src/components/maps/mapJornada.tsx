'use client';
import React, { useState } from 'react';
import {
  GoogleMap,
  Marker,
  Polyline,
  InfoWindow,
  useJsApiLoader
} from '@react-google-maps/api';

import './mapJornada.css';

const containerStyle = {
  width: '100%',
  height: '70vh',
};

const defaultCenter = { lat: -19.5833, lng: -65.7500 };

interface Punto {
  latitud: number;
  longitud: number;
}

interface Parada {
  nombre: string;
  latitud: number;
  longitud: number;
}

interface MapJornadaProps {
  routePoints: Punto[];
  stopPoints: Parada[];
  ubicacionActual?: Punto | null;
  center?: any | null;
}

const MapJornada = ({
  routePoints = [],
  stopPoints = [],
  ubicacionActual,
  center
}:any) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedStop, setSelectedStop] = useState<Parada | null>(null);

  // Estilo personalizado para los íconos de paradas
  const createStopIcon = () => ({
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: '#34A853',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 1,
    scale: 7,
  });

  // Ícono personalizado para la ubicación actual
  const createCurrentLocationIcon = () => ({
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 8,
  });

  if (!isLoaded) return <div>Cargando mapa...</div>;

  const mapCenter = center ?
    { lat: center.latitud, lng: center.longitud } :
    (ubicacionActual ?
      { lat: ubicacionActual.latitud, lng: ubicacionActual.longitud } :
      defaultCenter);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={14}
      onLoad={(map) => setMap(map)}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {/* Línea de ruta */}
      {routePoints.length > 1 && (
        <Polyline
          path={routePoints.map((p:any) => ({ lat: p.latitud, lng: p.longitud }))}
          options={{
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      )}

      {/* Marcadores de paradas */}
      {stopPoints.map((stop:any, index:any) => (
        <React.Fragment key={`stop-${index}`}>
          <Marker
            position={{ lat: stop.latitud, lng: stop.longitud }}
            icon={createStopIcon()}
            label={{
              text: stop.nombre,
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 'bold',
              className: 'map-stop-label',
            }}
            onClick={() => setSelectedStop(stop)}
          />

          {/* InfoWindow */}
          {selectedStop?.nombre === stop.nombre && (
            <InfoWindow
              position={{ lat: stop.latitud, lng: stop.longitud }}
              onCloseClick={() => setSelectedStop(null)}
            >
              <div style={{ padding: '8px', maxWidth: '200px' }}>
                <strong>🚏 {stop.nombre}</strong>
                <div style={{ fontSize: '0.8em', color: '#555' }}>
                  Lat: {stop.latitud.toFixed(6)}<br />
                  Lng: {stop.longitud.toFixed(6)}
                </div>
              </div>
            </InfoWindow>
          )}
        </React.Fragment>
      ))}

      {/* Marcador de ubicación actual */}
      {ubicacionActual && (
        <Marker
          position={{
            lat: ubicacionActual.latitud,
            lng: ubicacionActual.longitud
          }}
          icon={createCurrentLocationIcon()}
          title="Ubicación actual"
        />
      )}
    </GoogleMap>
  );
};

export default MapJornada;
