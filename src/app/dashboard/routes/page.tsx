'use client'
import React, { useState, useEffect, useMemo } from "react";
import MapHeader from "@/components/maps/map-header";
import dynamic from "next/dynamic";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import BusStopList from "@/components/maps/bus-stop-list";

interface Linea {
  _id: string;
  nombre: string;
  rutaIda: CoordenadaRuta[];
  rutaVuelta: CoordenadaRuta[];
  rutaAlternativaIda: CoordenadaRuta[];
  rutaAlternativaVuelta: CoordenadaRuta[];
  paradas: CoordenadaParada[];
  tieneVuelta: boolean;
}

interface CoordenadaRuta {
  latitud: number;
  longitud: number;
}

interface CoordenadaParada {
  nombre: string;
  latitud: number;
  longitud: number;
}

const Map = dynamic(() => import('../../../components/maps/map'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando mapa...</div>
});

export default function Page(): React.JSX.Element {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [lineaSeleccionada, setLineaSeleccionada] = useState<Linea | null>(null);
  const [mapKey, setMapKey] = useState(Date.now());
  const [currentDirection, setCurrentDirection] = useState<'ida' | 'vuelta'>('ida');

  const getLineas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas`);
      const data = await res.json();
      setLineas(data);
    } catch (error) {
      console.error('Error al obtener líneas:', error);
    }
  };

  const handleLineaChange = (lineaId: string) => {
    const linea = lineas.find(l => l._id === lineaId) || null;
    setLineaSeleccionada(linea);
    setMapKey(Date.now());
    setCurrentDirection('ida');
  };

  const toggleDirection = () => {
    setCurrentDirection(prev => prev === 'ida' ? 'vuelta' : 'ida');
  };

  useEffect(() => {
    getLineas();
  }, []);

  // Determinar qué rutas mostrar
  const { mainRoute, alternativeRoute, hasAlternativeRoute } = useMemo(() => {
    if (!lineaSeleccionada) return { mainRoute: [], alternativeRoute: [], hasAlternativeRoute: false };

    const main = currentDirection === 'ida' ? lineaSeleccionada.rutaIda : lineaSeleccionada.rutaVuelta;
    const alternative = currentDirection === 'ida'
      ? lineaSeleccionada.rutaAlternativaIda
      : lineaSeleccionada.rutaAlternativaVuelta;

    return {
      mainRoute: main,
      alternativeRoute: alternative,
      hasAlternativeRoute: alternative && alternative.length > 0
    };
  }, [lineaSeleccionada, currentDirection]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', height: '80vh' }}>
      <MapHeader
        lineas={lineas}
        getLineas={getLineas}
        onLineaChange={handleLineaChange}
        setLinea={setLineaSeleccionada}
      />

      <Card sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', flex: 1, overflow: 'hidden' }}>
        <CardContent sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {lineaSeleccionada ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Paradas de {lineaSeleccionada.nombre}
                </Typography>
                {lineaSeleccionada.tieneVuelta ? <Button
                    variant="outlined"
                    onClick={toggleDirection}
                    sx={{ textTransform: 'capitalize' }}
                  >
                    {currentDirection === 'ida' ? 'Mostrar vuelta' : 'Mostrar ida'}
                  </Button> : null}
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Dirección: {currentDirection === 'ida' ? 'Ida' : 'Vuelta'}
                </Typography>
                {hasAlternativeRoute ? <Typography variant="subtitle2" color="primary">
                    (Con ruta alternativa)
                  </Typography> : null}
              </Box>
              <BusStopList list={lineaSeleccionada.paradas.map(p => p.nombre)} />
            </>
          ) : (
            <Typography variant="body1">
              Seleccione una línea para ver sus paradas
            </Typography>
          )}
        </CardContent>
        <CardContent sx={{ p: 0 }}>
          <Map
            key={mapKey}
            routePoints={mainRoute}
            alternativeRoute={alternativeRoute}
            stopPoints={lineaSeleccionada?.paradas || []}
            mode="view"
            currentDirection={currentDirection}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
