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
  Snackbar,
  Alert,
  Tabs,
  Tab
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
  rutaIda: Punto[];
  rutaVuelta: Punto[];
  rutaAlternativaIda: Punto[];
  rutaAlternativaVuelta: Punto[];
  paradas: Parada[];
  tieneVuelta: boolean;
  estadoRutaAlternativa: boolean;
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
  const [linea, setLinea] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [jornadaStatus, setJornadaStatus] = useState<'inactiva' | 'activa' | 'pausada'>('inactiva');
  const [ubicacionActual, setUbicacionActual] = useState<Punto | null>(null);
  const [mapCenter, setMapCenter] = useState<Punto | null>(null);
  const [activeTab, setActiveTab] = useState<'ida' | 'vuelta'>('ida');
  const watchIdRef = useRef<number | null>(null);
  const [accionEnProgreso, setAccionEnProgreso] = useState<'iniciando' | 'pausando' | 'finalizando' | null>(null);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'ida' | 'vuelta') => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WEB_SOCKET_URL_CLOUD || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    const onUbicacion = (data: any) => {
      if (data.latitud && data.longitud) {
        const nuevaUbicacion = { latitud: data.latitud, longitud: data.longitud };
        setUbicacionActual(nuevaUbicacion);
        setMapCenter(nuevaUbicacion);
      }

      if (data.estado) {
        setJornadaStatus(data.estado);
      }
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
    if (!socket?.connected) {
      setSnackbar({
        open: true,
        message: 'No hay conexión en tiempo real disponible',
        severity: 'error'
      });
      return;
    }
    if (!linea) {
      setSnackbar({
        open: true,
        message: 'No hay ruta asignada',
        severity: 'error'
      });
      return;
    }
    if (!navigator.geolocation) {
      setSnackbar({
        open: true,
        message: 'Geolocalización no soportada por tu navegador',
        severity: 'error'
      });
      return;
    }

    setAccionEnProgreso('iniciando');
    socket.emit('unirse_sala', { salaId: `linea_${linea._id}` });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const estadoActual = 'activa';
        const ubicacion = {
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        };

        // Emitir ubicación inicial
        socket.emit('ubicacion', {
          conductorId: user?._id,
          lineaId: linea._id,
          salaId: `linea_${linea._id}`,
          timestamp: new Date().toISOString(),
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          estado: estadoActual
        });

        setJornadaStatus(estadoActual);
        setUbicacionActual(ubicacion);
        setMapCenter(ubicacion);

        // Configurar seguimiento de ubicación
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const ubicacionData = {
              conductorId: user?._id,
              lineaId: linea._id,
              salaId: `linea_${linea._id}`,
              timestamp: new Date().toISOString(),
              latitud: pos.coords.latitude,
              longitud: pos.coords.longitude,
              estado: estadoActual
            };
            socket.emit('ubicacion', ubicacionData);
          },
          (err) => {
            console.error('Error obteniendo ubicación:', err);
            setSnackbar({
              open: true,
              message: 'Error obteniendo ubicación GPS',
              severity: 'error'
            });
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );

        setSnackbar({
          open: true,
          message: 'Jornada iniciada correctamente',
          severity: 'success'
        });
        setAccionEnProgreso(null);
      },
      (err) => {
        console.error('Error al obtener permisos de ubicación:', err);
        setSnackbar({
          open: true,
          message: 'Debes permitir el uso del GPS para iniciar la jornada',
          severity: 'error'
        });
        setAccionEnProgreso(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePauseJornada = async () => {
    if (!socket?.connected) {
      setSnackbar({
        open: true,
        message: 'No hay conexión en tiempo real disponible',
        severity: 'error'
      });
      return;
    }

    setAccionEnProgreso('pausando');
    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      // Emitir pausa al servidor
      socket.emit('ubicacion', {
        conductorId: user?._id,
        lineaId: linea?._id,
        salaId: `linea_${linea?._id}`,
        timestamp: new Date().toISOString(),
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
        estado: 'pausada'
      });

      setJornadaStatus('pausada');
      setUbicacionActual(null);

      setSnackbar({
        open: true,
        message: 'Jornada pausada correctamente',
        severity: 'success'
      });
    } catch (err) {
      console.error('jornada pausada', err);
      setJornadaStatus('pausada');
      setUbicacionActual(null);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al pausar jornada',
        severity: 'error'
      });
    } finally {
      setAccionEnProgreso(null);
    }
  };

  const handleFinishJornada = async () => {
    if (!socket?.connected) {
      setSnackbar({
        open: true,
        message: 'No hay conexión en tiempo real disponible',
        severity: 'error'
      });
      return;
    }

    setAccionEnProgreso('finalizando');
    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      // Emitir finalización al servidor
      socket.emit('ubicacion', {
        conductorId: user?._id,
        lineaId: linea?._id,
        salaId: `linea_${linea?._id}`,
        timestamp: new Date().toISOString(),
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
        estado: 'inactiva'
      });

      setJornadaStatus('inactiva');
      setUbicacionActual(null);

      setSnackbar({
        open: true,
        message: 'Jornada finalizada correctamente',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error al finalizar jornada:', err);
      setJornadaStatus('inactiva');
      setUbicacionActual(null);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al finalizar jornada',
        severity: 'error'
      });
    } finally {
      setAccionEnProgreso(null);
    }
  };

  const getLineaConductor = async () => {
    try {
      setLoading(true);
      const fechaActual = new Date();
      const diaSemana = fechaActual.getDay();
      const offsetLaPaz = -4 * 60;
      const fechaLaPaz = new Date(fechaActual.getTime() + offsetLaPaz * 60 * 1000);
      const fechaISO = fechaLaPaz.toISOString().split('T')[0];
      const conductorId = user?._id;

      const placa = user?.matricula;
      if (!placa) throw new Error('No se encontró la matrícula del conductor');

      const numeroParte = placa.split('-')[0];
      const ultimoDigito = parseInt(numeroParte[numeroParte.length - 1]);

      if (isNaN(ultimoDigito)) throw new Error('La matrícula no termina en un número válido');

      const restricciones: any = {
        1: [0, 1], 2: [2, 3], 3: [4, 5], 4: [6, 7], 5: [8, 9]
      };

      if (restricciones[diaSemana]?.includes(ultimoDigito)) {
        setSnackbar({
          open: true,
          message: `No puedes circular hoy por restricción vehicular (placa termina en ${ultimoDigito})`,
          severity: 'warning'
        });
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/obtener/linea?fecha=${fechaISO}&conductorId=${conductorId}`
      );

      if (!response.ok) throw new Error('Error al obtener la línea del conductor');
      const data = await response.json();
      setLinea(data.rutaId);

    } catch (err) {
      console.error('Error:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'No tienes una línea asignada para hoy',
        severity: 'warning'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      getLineaConductor();
    }
  }, [user?._id]);

  const getCurrentRoutePoints = () => {
    if (!linea) return [];
    return activeTab === 'ida' ? linea.rutaIda : linea.rutaVuelta;
  };

  const getAlternativeRoutePoints = () => {
    if (!linea) return [];
    return activeTab === 'ida' ? linea.rutaAlternativaIda : linea.rutaAlternativaVuelta;
  };

  const getCurrentStops = () => {
    if (!linea) return [];
    return linea.paradas;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Jornada {jornadaStatus !== 'inactiva' && `(Estado: ${jornadaStatus})`}
        </Typography>

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
                      value={linea?.nombre || 'No asignado'}
                      variant="outlined"
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={!linea || jornadaStatus === 'activa' || accionEnProgreso !== null}
                      onClick={handleStartJornada}
                    >
                      {accionEnProgreso === 'iniciando' ? 'Iniciando...' : 'Inicio'}
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      disabled={!linea || jornadaStatus !== 'activa' || accionEnProgreso !== null}
                      onClick={handlePauseJornada}
                    >
                      {accionEnProgreso === 'pausando' ? 'Pausando...' : 'Pausa'}
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      disabled={!linea || jornadaStatus === 'inactiva' || accionEnProgreso !== null}
                      onClick={handleFinishJornada}
                    >
                      {accionEnProgreso === 'finalizando' ? 'Finalizando...' : 'Fin'}
                    </Button>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>

            {linea?.tieneVuelta && (
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="Ruta tabs">
                  <Tab label="Ruta de Ida" value="ida" />
                  <Tab label="Ruta de Vuelta" value="vuelta" />
                </Tabs>
              </Box>
            )}

            <CardContent sx={{ height: 400, mt: 2 }}>
              {linea ? (
                <Map
                  routePoints={getCurrentRoutePoints()}
                  alternativeRoutePoints={getAlternativeRoutePoints()}
                  showAlternative={linea?.estadoRutaAlternativa || false}
                  center={mapCenter || { latitud: -19.5833, longitud: -65.7500 }}
                  ubicacionActual={ubicacionActual}
                  routeName={linea.nombre}
                  routeType={activeTab === 'ida' ? 'Ida' : 'Vuelta'}
                />
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography>No hay ruta asignada para mostrar</Typography>
                </Box>
              )}
            </CardContent>
          </>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
