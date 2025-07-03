'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
  Grid,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dynamic from 'next/dynamic';
import { useUser } from "@/hooks/use-user";
import { io, type Socket } from 'socket.io-client';

interface Punto {
  latitud: number;
  longitud: number;
}

interface Parada {
  nombre: string;
  latitud: number;
  longitud: number;
}

interface Ruta {
  _id: string;
  nombre: string;
  rutas: Punto[];
  paradas: Parada[];
}



const Map = dynamic(() => import('../../../components/maps/mapJornada'), {
  ssr: false,
  loading: () => (
    <Box height={400} display="flex" alignItems="center" justifyContent="center">
      <CircularProgress />
    </Box>
  ),
});

export default function JornadaPage(): JSX.Element {
  const { user } = useUser();
  const [linea, setLinea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [jornadaStatus, setJornadaStatus] = useState<'inactiva' | 'activa' | 'pausada'>('inactiva');
  const [ubicacionActual, setUbicacionActual] = useState<Punto | null>(null);
  const [mapCenter, setMapCenter] = useState<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<Punto | null>(null);
  // Conexión con Socket.IO
  useEffect(() => {
// const socketInstance = io('wss://backend-gps-geolocalizacion-dark-thunder-4226.fly.dev', {
//   transports: ['websocket'],
// });

const socketInstance = io(process.env.NEXT_PUBLIC_WEB_SOCKET_URL_CLOUD || 'http://localhost:5000', {
  transports: ['websocket'],
});
    const onUbicacion = (data: any) => {
      const nuevaUbicacion = { latitud: data.latitud, longitud: data.longitud };
      setUbicacionActual(nuevaUbicacion);
      setMapCenter(nuevaUbicacion);
    };

    socketInstance.on('connect', () => {
      console.log('Socket.IO conectado');
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.IO desconectado');
      setSocket(null);
    });

    socketInstance.on('ubicacion_actual', onUbicacion);

    return () => {
      socketInstance.off('ubicacion_actual', onUbicacion);
      socketInstance.disconnect();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);


  const handleStartJornada = () => {
    if (!socket?.connected) { setError('No hay conexión en tiempo real disponible'); return; }
    if (!linea) { setError('No hay ruta asignada'); return; }
    if (!navigator.geolocation) { setError('Geolocalización no soportada'); return; }

    // if (jornadaStatus == 'inactiva'){
    //   alert('La jornada a terminado!!!')
    // }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const estadoActual = 'activa';
        setJornadaStatus(estadoActual);

        const ubicacion = {
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        };

        // Enviar ubicación inicial
        socket.emit('ubicacion', {
          conductorId: user?._id, // Asegúrate de tener el ID del conductor
          lineaId: linea.rutaId._id,
          salaId: `linea_${linea.rutaId._id}`,
          timestamp: new Date().toISOString(),
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          estado: estadoActual,
        });

        setUbicacionActual(ubicacion);
        setMapCenter(ubicacion);

        // Activar seguimiento en tiempo real
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            socket.emit('ubicacion', {
              conductorId: user?._id,
              lineaId: linea.rutaId._id,
              salaId: `linea_${linea.rutaId._id}`,
              timestamp: new Date().toISOString(),
              latitud: pos.coords.latitude,
              longitud: pos.coords.longitude,
              estado: estadoActual
            });
          },
          (err) => { console.error('Error obteniendo ubicación:', err); },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );

        watchIdRef.current = id;
      },
      (err) => {
        console.error('Error al obtener permisos de ubicación:', err);
        setError('Debes permitir el uso del GPS para iniciar la jornada');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePauseJornada = () => {
    if (!socket?.connected) {
      setError('No hay conexión en tiempo real disponible');
      return;
    }

    // 1. Detener el seguimiento en tiempo real
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // 2. Actualizar el estado local primero para reflejar cambios inmediatos
    setJornadaStatus('pausada');
    setUbicacionActual(null); // Limpiar ubicación actual inmediatamente

    // 3. Obtener y enviar la última ubicación con estado 'pausada'
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Crear objeto de ubicación pausada
        const ubicacionPausada = {
          conductorId: user?._id,
          lineaId: linea?.rutaId._id,
          salaId: linea ? `linea_${linea.rutaId._id}` : undefined,
          timestamp: new Date().toISOString(),
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          estado: 'pausada',
          message: 'Jornada pausada'
        };

        // Enviar al servidor
        socket.emit('ubicacion', ubicacionPausada);

      },
      (err) => {
        console.error('Error obteniendo ubicación:', err);
        // Enviar mensaje de pausa sin ubicación
        socket.emit('ubicacion', {
          conductorId: user?._id,
          lineaId: linea?.rutaId._id,
          salaId: linea ? `linea_${linea.rutaId._id}` : undefined,
          timestamp: new Date().toISOString(),
          estado: 'pausada',
          message: 'Jornada pausada (sin ubicación)'
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleFinishJornada = () => {
  if (!socket?.connected) {
    setError('No hay conexión en tiempo real disponible');
    return;
  }

  // 1. Detener el seguimiento de ubicación si está activo
  if (watchIdRef.current !== null) {
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }

  // 2. Actualizar estado local
  setJornadaStatus('inactiva');
  setUbicacionActual(null); // Limpiar ubicación actual inmediatamente

  // 3. Obtener y enviar la última ubicación con estado 'inactiva'
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const ubicacionFinal = {
        conductorId: user?._id,
        lineaId: linea?.rutaId._id,
        salaId: linea ? `linea_${linea?.rutaId._id}` : undefined,
        timestamp: new Date().toISOString(),
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
        estado: 'inactiva',
      };

      socket.emit('ubicacion', ubicacionFinal);
    },
    (err) => {
      console.error('Error obteniendo ubicación:', err);

      socket.emit('ubicacion', {
        conductorId: user?._id,
        lineaId: linea?.rutaId._id,
        salaId: linea ? `linea_${linea?.rutaId._id}` : undefined,
        timestamp: new Date().toISOString(),
        estado: 'inactiva',
      });
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
};


  const getLineaConductor = async () => {
    try {
      setLoading(true);
      setError(null);

      const fechaActual = new Date().toISOString().split('T')[0];
      // const fechaActual = new Date().toLocaleDateString('en-CA', {
      //   timeZone: 'America/La_Paz',
      //   year: 'numeric',
      //   month: '2-digit',
      //   day: '2-digit'
      // }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
      const conductorId = user?._id;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/obtener/linea?fecha=${fechaActual}&conductorId=${conductorId}`
      );

      if (!response.ok) throw new Error('Error al obtener la línea del conductor');
      const data = await response.json();
      setLinea(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Error no tiene linea asignada');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    if (user?._id) {
      getLineaConductor();
    }
  }, [user?._id]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Jornada {jornadaStatus !== 'inactiva' && `(Estado: ${jornadaStatus})`}
        </Typography>

        {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper elevation={3} sx={{ p: 3, maxWidth: 1000 }}>
              <Stack spacing={3}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Asignación"
                      value={linea?.rutaId?.nombre || 'No asignado'}
                      variant="outlined"
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button variant="contained" color="primary" fullWidth size="medium"
                      disabled={!linea || jornadaStatus === 'activa'} onClick={handleStartJornada}>
                      Inicio
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button variant="contained" color="secondary" fullWidth size="medium"
                      disabled={!linea || jornadaStatus !== 'activa'} onClick={handlePauseJornada}>
                      Pausa
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button variant="contained" color="success" fullWidth size="medium"
                      disabled={!linea || jornadaStatus === 'inactiva'} onClick={handleFinishJornada}>
                      Fin
                    </Button>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>

            <CardContent sx={{ height: 400, mt: 2 }}>
              {linea ? (
                <Map
                  routePoints={linea.rutaId.rutas}
                  stopPoints={linea.rutaId.paradas}
                  ubicacionActual={ubicacionActual}
                  center={mapCenter}
                />
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography>No hay ruta asignada para mostrar</Typography>
                </Box>
              )}
            </CardContent>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
}
