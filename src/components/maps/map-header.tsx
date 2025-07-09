'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Modal,
  Box,
  TextField,
  Stack,
  IconButton,
  Grid,
  Select,
  InputLabel,
  MenuItem,
  Paper,
  Divider,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  DialogTitle,
  DialogContent,
  DialogActions,
  Dialog,
  FormControlLabel,
  Switch
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import dynamic from 'next/dynamic';
import { useUser } from "@/hooks/use-user";
import { useRouter } from 'next/navigation'; // Next.js 13+ (App Router)

const Map = dynamic(() => import('./map'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
});

// Paleta de colores
const COLORES = {
  IDA: {
    principal: '#1976d2', // Azul principal para ida
    alternativa: '#64b5f6', // Azul claro para alternativas de ida
  },
  VUELTA: {
    principal: '#d81b60', // Rosa principal para vuelta
    alternativa: '#f06292', // Rosa claro para alternativas de vuelta
  },
  PARADAS: '#4caf50', // Verde para paradas
  MODO_ACTIVO: '#ff9800', // Naranja para resaltar modo activo
  FONDO: '#f5f5f5', // Gris claro para fondos
};

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 1000,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

interface CoordenadaRuta {
  latitud: number;
  longitud: number;
}

interface CoordenadaParada {
  nombre: string;
  latitud: number;
  longitud: number;
}

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

type Modo = 'ruta' | 'parada' | 'alternativa';
type Direccion = 'ida' | 'vuelta';

export default function MapHeader({ lineas, getLineas, onLineaChange,setLinea, setMapKey}: any) {
  const [open, setOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [lineaSeleccionada, setLineaSeleccionada] = useState<Linea | null>(null);

  // Estados para rutas
  const [rutaIda, setRutaIda] = useState<CoordenadaRuta[]>([]);
  const [rutaVuelta, setRutaVuelta] = useState<CoordenadaRuta[]>([]);
  const [rutaAlternativaIda, setRutaAlternativaIda] = useState<CoordenadaRuta[]>([]);
  const [rutaAlternativaVuelta, setRutaAlternativaVuelta] = useState<CoordenadaRuta[]>([]);
  const [paradas, setParadas] = useState<CoordenadaParada[]>([]);

  const [currentStopName, setCurrentStopName] = useState('');
  const [mode, setMode] = useState<Modo>('ruta');
  const [currentDirection, setCurrentDirection] = useState<Direccion>('ida');
  const [hasReturnRoute, setHasReturnRoute] = useState(false);
  const [editingAlternative, setEditingAlternative] = useState(false);
const router = useRouter();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { permissions } = useUser();
  const mapRef = useRef<any>(null);

  const handleChange = (event: any) => {
    const lineaId = event.target.value;
    const linea = lineas.find((l: any) => l._id === lineaId) || null;
    setLineaSeleccionada(linea);
    onLineaChange(lineaId);
  };

  const handleOpenEdit = () => {
    if (!lineaSeleccionada) {
      setSnackbar({
        open: true,
        message: 'Por favor seleccione una línea primero',
        severity: 'error',
      });
      return;
    }
    setRouteName(lineaSeleccionada.nombre);
    setRutaIda(lineaSeleccionada.rutaIda);
    setRutaVuelta(lineaSeleccionada.rutaVuelta);
    setRutaAlternativaIda(lineaSeleccionada.rutaAlternativaIda || []);
    setRutaAlternativaVuelta(lineaSeleccionada.rutaAlternativaVuelta || []);
    setParadas(lineaSeleccionada.paradas);
    setHasReturnRoute(lineaSeleccionada.tieneVuelta);
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
    setRouteName('');
    setRutaIda([]);
    setRutaVuelta([]);
    setRutaAlternativaIda([]);
    setRutaAlternativaVuelta([]);
    setParadas([]);
    setCurrentStopName('');
    setMode('ruta');
    setCurrentDirection('ida');
    setHasReturnRoute(false);
    setEditingAlternative(false);
  };

  const handleOpen = () => {
    setOpen(true);
    setMode('ruta');
    setCurrentDirection('ida');
    setHasReturnRoute(false);
    setEditingAlternative(false);
  };


  const handleClose = () => {
    setOpen(false);
    setRouteName('');
    setRutaIda([]);
    setRutaVuelta([]);
    setRutaAlternativaIda([]);
    setRutaAlternativaVuelta([]);
    setParadas([]);
    setCurrentStopName('');
    setMode('ruta');
    setCurrentDirection('ida');
    setHasReturnRoute(false);
    setEditingAlternative(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (!lat || !lng) return;

    if (mode === 'ruta') {
      if (currentDirection === 'ida') {
        setRutaIda([...rutaIda, { latitud: lat, longitud: lng }]);
      } else {
        setRutaVuelta([...rutaVuelta, { latitud: lat, longitud: lng }]);
      }
    } else if (mode === 'parada' && currentStopName) {
      setParadas([...paradas, { nombre: currentStopName, latitud: lat, longitud: lng }]);
      setCurrentStopName('');
    } else if (mode === 'alternativa') {
      if (currentDirection === 'ida') {
        setRutaAlternativaIda([...rutaAlternativaIda, { latitud: lat, longitud: lng }]);
      } else {
        setRutaAlternativaVuelta([...rutaAlternativaVuelta, { latitud: lat, longitud: lng }]);
      }
    }
  };

  const handleSaveRoute = async () => {
    if (!routeName || rutaIda.length === 0 || (hasReturnRoute && rutaVuelta.length === 0)) {
      setSnackbar({
        open: true,
        message: 'Complete los datos requeridos para la ruta',
        severity: 'error',
      });
      return;
    }

    const routeData = {
      nombre: routeName,
      rutaIda,
      rutaVuelta: hasReturnRoute ? rutaVuelta : [],
      rutaAlternativaIda,
      rutaAlternativaVuelta: hasReturnRoute ? rutaAlternativaVuelta : [],
      paradas,
      tieneVuelta: hasReturnRoute
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Ruta guardada exitosamente',
          severity: 'success',
        });
        getLineas?.();
        handleClose();
      } else {
        throw new Error('Error al guardar la ruta');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al guardar la ruta',
        severity: 'error',
      });
    }
  };

  const handleRemoveRoutePoint = (direction: Direccion, index: number) => {
    if (direction === 'ida') {
      setRutaIda(rutaIda.filter((_, i) => i !== index));
    } else {
      setRutaVuelta(rutaVuelta.filter((_, i) => i !== index));
    }
    if (mapRef.current) {
      mapRef.current.resetMap();
    }
  };

  const handleRemoveAlternative = (direction: Direccion) => {
    if (direction === 'ida') {
      setRutaAlternativaIda([]);
    } else {
      setRutaAlternativaVuelta([]);
    }
    setEditingAlternative(false);
    setMode('ruta');
    if (mapRef.current) {
      mapRef.current.resetMap();
    }
  };

  const handleRemoveStop = (index: number) => {
    setParadas(paradas.filter((_, i) => i !== index));
    if (mapRef.current) {
      mapRef.current.resetMap();
    }
  };

  const handleRemovePoint = (index: number) => {
    if (mode === 'ruta') {
      if (currentDirection === 'ida') {
        const newRoute = [...rutaIda];
        newRoute.splice(index, 1);
        setRutaIda(newRoute);
      } else {
        const newRoute = [...rutaVuelta];
        newRoute.splice(index, 1);
        setRutaVuelta(newRoute);
      }
    } else if (mode === 'alternativa') {
      if (currentDirection === 'ida') {
        const newAlternative = [...rutaAlternativaIda];
        newAlternative.splice(index, 1);
        setRutaAlternativaIda(newAlternative);
      } else {
        const newAlternative = [...rutaAlternativaVuelta];
        newAlternative.splice(index, 1);
        setRutaAlternativaVuelta(newAlternative);
      }
    }

    if (mapRef.current) {
      mapRef.current.resetMap();
    }
  };

  const handleUpdateRoute = async () => {
    if (!lineaSeleccionada) return;

    if (!routeName || rutaIda.length === 0 || (hasReturnRoute && rutaVuelta.length === 0)) {
      setSnackbar({
        open: true,
        message: 'Complete los datos requeridos para la ruta',
        severity: 'error',
      });
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/${lineaSeleccionada._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: routeName,
          rutaIda,
          rutaVuelta: hasReturnRoute ? rutaVuelta : [],
          rutaAlternativaIda,
          rutaAlternativaVuelta: hasReturnRoute ? rutaAlternativaVuelta : [],
          paradas,
          tieneVuelta: hasReturnRoute
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la línea');
      }
      const updatedLinea = await response.json(); // Obtenemos los datos actualizados
      setLineaSeleccionada(updatedLinea);
setLinea(updatedLinea)
      setSnackbar({
        open: true,
        message: 'Ruta actualizada exitosamente',
        severity: 'success',
      });

      getLineas?.();
      handleCloseEdit();
      handleClear();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error inesperado',
        severity: 'error',
      });
    }
  };

  const handleDeleteClick = () => {
    if (!lineaSeleccionada) {
      setSnackbar({
        open: true,
        message: 'Por favor seleccione una línea primero',
        severity: 'error',
      });
      return;
    }
    setOpenDeleteConfirm(true);
  };

const handleDeleteRoute = async () => {
  if (!lineaSeleccionada) return;

  setIsLoading(true);
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/${lineaSeleccionada._id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setSnackbar({
        open: true,
        message: 'Línea eliminada exitosamente',
        severity: 'success',
      });

      // Limpiar estados
      setRutaIda([]);
      setRutaVuelta([]);
      setRutaAlternativaIda([]);
      setRutaAlternativaVuelta([]);
      setParadas([]);
      setCurrentStopName('');
      setMode('ruta');
      setRouteName('');
      setLineaSeleccionada(null);
      setLinea(null);

      // Forzar refresco del mapa
setMapKey(new Date())
      await getLineas?.();
    } else {
      throw new Error('Error al eliminar la línea');
    }
  } catch (error) {
    setSnackbar({
      open: true,
      message: error instanceof Error ? error.message : 'Error al eliminar la línea',
      severity: 'error',
    });
  } finally {
    setIsLoading(false);
    setOpenDeleteConfirm(false);
  }
};

  const handleClear = () => {
    setRutaIda([]);
    setRutaVuelta([]);
    setRutaAlternativaIda([]);
    setRutaAlternativaVuelta([]);
    setParadas([]);
    setCurrentStopName('');
    setEditingAlternative(false);
    setMode('ruta');
    if (mapRef.current) {
      mapRef.current.clearMap();
    }
  };

  const handleAddAlternative = () => {
    setEditingAlternative(true);
    setMode('alternativa');
  };

  const getCurrentRoutePoints = () => {
    if (mode === 'ruta') {
      return currentDirection === 'ida' ? rutaIda : rutaVuelta;
    } else if (mode === 'alternativa') {
      return currentDirection === 'ida' ? rutaAlternativaIda : rutaAlternativaVuelta;
    }
    return [];
  };

  const renderRoutePointsList = (direction: Direccion) => {
    const points = direction === 'ida' ? rutaIda : rutaVuelta;
    return (
      <Paper elevation={2} sx={{
        p: 2,
        mb: 2,
        borderLeft: `4px solid ${direction === 'ida' ? COLORES.IDA.principal : COLORES.VUELTA.principal}`
      }}>
        <Typography variant="subtitle2" gutterBottom sx={{
          color: direction === 'ida' ? COLORES.IDA.principal : COLORES.VUELTA.principal,
          fontWeight: 'bold'
        }}>
          Puntos de ruta de {direction} ({points.length})
        </Typography>
        <List dense>
          {points.map((_, index) => (
            <ListItem key={`${direction}-${index}`}>
              <ListItemText
                primary={`Punto ${index + 1}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => { handleRemoveRoutePoint(direction, index); }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  const renderAlternativeRoutesSection = () => {
    return (
      <>
        <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
          Rutas Alternativas
        </Typography>

        {/* Alternativa de ida - siempre visible */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 2,
            borderLeft: `4px solid ${COLORES.IDA.alternativa}`,
            backgroundColor: mode === 'alternativa' && currentDirection === 'ida' ?
              `${COLORES.IDA.alternativa}20` : 'inherit'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" gutterBottom sx={{
              color: COLORES.IDA.alternativa,
              fontWeight: 'bold'
            }}>
              Ruta alternativa de ida ({rutaAlternativaIda.length} puntos)
            </Typography>
            <Box>
              <IconButton
                size="small"
                onClick={() => {
                  setCurrentDirection('ida');
                  setMode('alternativa');
                }}
                sx={{
                  color: mode === 'alternativa' && currentDirection === 'ida' ?
                    COLORES.MODO_ACTIVO : 'inherit'
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              {rutaAlternativaIda.length > 0 && (
                <IconButton
                  size="small"
                  onClick={() => { handleRemoveAlternative('ida'); }}
                  sx={{ color: COLORES.IDA.alternativa }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
          {rutaAlternativaIda.length > 0 ? (
            <List dense>
              {rutaAlternativaIda.map((_, index) => (
                <ListItem key={`alt-ida-${index}`}>
                  <ListItemText primary={`Punto ${index + 1}`} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        if (mode === 'alternativa' && currentDirection === 'ida') {
                          handleRemovePoint(index);
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No hay ruta alternativa definida
            </Typography>
          )}
        </Paper>

        {/* Alternativa de vuelta - solo si tiene ruta de vuelta */}
        {hasReturnRoute ? <Paper
            elevation={2}
            sx={{
              p: 2,
              mb: 2,
              borderLeft: `4px solid ${COLORES.VUELTA.alternativa}`,
              backgroundColor: mode === 'alternativa' && currentDirection === 'vuelta' ?
                `${COLORES.VUELTA.alternativa}20` : 'inherit'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" gutterBottom sx={{
                color: COLORES.VUELTA.alternativa,
                fontWeight: 'bold'
              }}>
                Ruta alternativa de vuelta ({rutaAlternativaVuelta.length} puntos)
              </Typography>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    setCurrentDirection('vuelta');
                    setMode('alternativa');
                  }}
                  sx={{
                    color: mode === 'alternativa' && currentDirection === 'vuelta' ?
                      COLORES.MODO_ACTIVO : 'inherit'
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                {rutaAlternativaVuelta.length > 0 && (
                  <IconButton
                    size="small"
                    onClick={() => { handleRemoveAlternative('vuelta'); }}
                    sx={{ color: COLORES.VUELTA.alternativa }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
            {rutaAlternativaVuelta.length > 0 ? (
              <List dense>
                {rutaAlternativaVuelta.map((_, index) => (
                  <ListItem key={`alt-vuelta-${index}`}>
                    <ListItemText primary={`Punto ${index + 1}`} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          if (mode === 'alternativa' && currentDirection === 'vuelta') {
                            handleRemovePoint(index);
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No hay ruta alternativa definida
              </Typography>
            )}
          </Paper> : null}
      </>
    );
  };

  const renderMainRoutesSection = () => {
    return (
      <>
        <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
          Rutas Principales
        </Typography>

        {renderRoutePointsList('ida')}

        {hasReturnRoute ? renderRoutePointsList('vuelta') : null}
      </>
    );
  };

  const renderStopsSection = () => {
    if (paradas.length === 0) return null;

    return (
      <>
        <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
          Paradas
        </Typography>
        <Paper elevation={2} sx={{
          p: 2,
          borderLeft: `4px solid ${COLORES.PARADAS}`
        }}>
          <Typography variant="subtitle2" gutterBottom sx={{
            color: COLORES.PARADAS,
            fontWeight: 'bold'
          }}>
            Paradas ({paradas.length})
          </Typography>
          <List dense>
            {paradas.map((parada, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={parada.nombre}
                  secondary={`${parada.latitud.toFixed(4)}, ${parada.longitud.toFixed(4)}`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => { handleRemoveStop(index); }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      </>
    );
  };

  return (
    <>
      <Card sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h3">Líneas</Typography>
            <Box sx={{ minWidth: 200 }}>
              <InputLabel id="lineas-select-label">Seleccionar línea</InputLabel>
              <Select
                labelId="lineas-select-label"
                id="lineas-select"
                value={lineaSeleccionada?._id || ''}
                onChange={handleChange}
                fullWidth
                size="small"
                sx={{ mt: 1 }}
              >
                {Array.isArray(lineas) && lineas.length > 0 ? (
                  lineas.map((linea) => (
                    <MenuItem key={linea._id} value={linea._id}>
                      {linea.nombre}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No hay líneas disponibles
                  </MenuItem>
                )}
              </Select>
            </Box>
          </Box>
        </CardContent>

        <CardContent sx={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '1.5rem'
        }}>
          {permissions?.includes('eliminar-ruta') ? <Button
              variant="contained"
              color="error"
              onClick={handleDeleteClick}
              sx={{
                minWidth: 120,
                padding: '8px 16px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
                  backgroundColor: '#d32f2f'
                }
              }}
              startIcon={<DeleteIcon />}
            >
              Eliminar Ruta
            </Button> : null}

          <Button
            variant="contained"
            onClick={handleOpenEdit}
            sx={{
              minWidth: 120,
              padding: '8px 16px',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              boxShadow: 'none',
              backgroundColor: '#1976d2',
              '&:hover': {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
                backgroundColor: '#1565c0'
              }
            }}
            startIcon={<EditIcon />}
          >
            Editar
          </Button>

          {permissions?.includes('crear-ruta') ? <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{
                minWidth: 140,
                padding: '8px 16px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: 'none',
                backgroundColor: '#4caf50',
                '&:hover': {
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
                  backgroundColor: '#388e3c'
                }
              }}
            >
              Crear Línea
            </Button> : null}
        </CardContent>
      </Card>

      <Dialog
        open={openDeleteConfirm}
        onClose={() => { setOpenDeleteConfirm(false); }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la línea "{lineaSeleccionada?.nombre}"? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => { setOpenDeleteConfirm(false); }}
            color="primary"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteRoute}
            color="error"
            autoFocus
            disabled={isLoading}
            startIcon={<DeleteIcon />}
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edición */}
      <Modal open={openEditModal} onClose={handleCloseEdit}>
        <Box sx={modalStyle}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography  variant="h5">
              Editar ruta: {lineaSeleccionada?.nombre || ''}
            </Typography>
            <IconButton onClick={handleCloseEdit}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{
                height: '500px',
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#888',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#555'
                }
              }}>
                <Stack spacing={2}>
                  <TextField
                   style={{ marginTop: '10px' }}
                    fullWidth
                    label="Nombre de la ruta"
                    value={routeName}
                    onChange={(e) => { setRouteName(e.target.value); }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={hasReturnRoute}
                        onChange={(e) => { setHasReturnRoute(e.target.checked); }}
                        color="secondary"
                      />
                    }
                    label="Incluir ruta de vuelta"
                  />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={mode === 'ruta' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setMode('ruta');
                      }}
                      fullWidth
                      sx={{
                        backgroundColor: mode === 'ruta' ? COLORES.MODO_ACTIVO : 'inherit',
                        color: mode === 'ruta' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: mode === 'ruta' ? '#e68a00' : COLORES.FONDO,
                        }
                      }}
                    >
                      Modo Ruta
                    </Button>
                    <Button
                      variant={mode === 'parada' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setMode('parada');
                      }}
                      fullWidth
                      sx={{
                        backgroundColor: mode === 'parada' ? COLORES.PARADAS : 'inherit',
                        color: mode === 'parada' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: mode === 'parada' ? '#388e3c' : COLORES.FONDO,
                        }
                      }}
                    >
                      Modo Parada
                    </Button>
                    <Button
                      variant={mode === 'alternativa' ? 'contained' : 'outlined'}
                      onClick={handleAddAlternative}
                      fullWidth
                      disabled={!currentDirection}
                      sx={{
                        backgroundColor: mode === 'alternativa' ?
                          (currentDirection === 'ida' ? COLORES.IDA.alternativa : COLORES.VUELTA.alternativa) :
                          'inherit',
                        color: mode === 'alternativa' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: mode === 'alternativa' ?
                            (currentDirection === 'ida' ? '#42a5f5' : '#ec407a') :
                            COLORES.FONDO,
                        }
                      }}
                    >
                      {mode === 'alternativa' ? 'Editando Alternativa' : 'Nueva Alternativa'}
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={currentDirection === 'ida' ? 'contained' : 'outlined'}
                      onClick={() => { setCurrentDirection('ida'); }}
                      fullWidth
                      sx={{
                        backgroundColor: currentDirection === 'ida' ? COLORES.IDA.principal : 'inherit',
                        color: currentDirection === 'ida' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: currentDirection === 'ida' ? '#1565c0' : COLORES.FONDO,
                        }
                      }}
                    >
                      Ruta Ida
                    </Button>
                    <Button
                      variant={currentDirection === 'vuelta' ? 'contained' : 'outlined'}
                      onClick={() => { setCurrentDirection('vuelta'); }}
                      fullWidth
                      disabled={!hasReturnRoute}
                      sx={{
                        backgroundColor: currentDirection === 'vuelta' ? COLORES.VUELTA.principal : 'inherit',
                        color: currentDirection === 'vuelta' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: currentDirection === 'vuelta' ? '#c2185b' : COLORES.FONDO,
                        }
                      }}
                    >
                      Ruta Vuelta
                    </Button>
                  </Box>

                  {mode === 'parada' && (
                    <TextField
                      fullWidth
                      label="Nombre de la parada"
                      value={currentStopName}
                      onChange={(e) => { setCurrentStopName(e.target.value); }}
                      helperText="Escriba el nombre y luego haga click en el mapa"
                      sx={{
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: COLORES.PARADAS,
                        },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: COLORES.PARADAS,
                        }
                      }}
                    />
                  )}

                  {renderMainRoutesSection()}
                  {renderAlternativeRoutesSection()}
                  {renderStopsSection()}

                  <Box sx={{
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: 'background.paper',
                    pt: 2,
                    pb: 1,
                    zIndex: 1
                  }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleUpdateRoute}
                        disabled={!routeName || rutaIda.length === 0 || (hasReturnRoute && rutaVuelta.length === 0)}
                        fullWidth
                        sx={{
                          backgroundColor: '#1976d2',
                          '&:hover': {
                            backgroundColor: '#1565c0'
                          }
                        }}
                      >
                        Actualizar Ruta
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleClear}
                      >
                        Limpiar Todo
                      </Button>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ height: '500px', width: '100%' }}>
                <Map
      ref={mapRef}
      onMapClick={handleMapClick}
      routePoints={currentDirection === 'ida' ? rutaIda : rutaVuelta}
      alternativeRoute={currentDirection === 'ida' ? rutaAlternativaIda : rutaAlternativaVuelta}
      stopPoints={paradas}
      mode={mode}
      currentDirection={currentDirection}
    />

              </Box>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* Modal de Creación */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">Nueva ruta</Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{
                height: '500px',
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#888',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#555'
                }
              }}>
                <Stack spacing={2}>
                  <TextField
  style={{ marginTop: '10px' }}
                    fullWidth
                    label="Nombre de la ruta"
                    value={routeName}
                    onChange={(e) => { setRouteName(e.target.value); }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={hasReturnRoute}
                        onChange={(e) => { setHasReturnRoute(e.target.checked); }}
                        color="secondary"
                      />
                    }
                    label="Incluir ruta de vuelta"
                  />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={mode === 'ruta' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setMode('ruta');
                      }}
                      fullWidth
                      sx={{
                        backgroundColor: mode === 'ruta' ? COLORES.MODO_ACTIVO : 'inherit',
                        color: mode === 'ruta' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: mode === 'ruta' ? '#e68a00' : COLORES.FONDO,
                        }
                      }}
                    >
                      Modo Ruta
                    </Button>
                    <Button
                      variant={mode === 'parada' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setMode('parada');
                      }}
                      fullWidth
                      sx={{
                        backgroundColor: mode === 'parada' ? COLORES.PARADAS : 'inherit',
                        color: mode === 'parada' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: mode === 'parada' ? '#388e3c' : COLORES.FONDO,
                        }
                      }}
                    >
                      Modo Parada
                    </Button>
                    <Button
                      variant={mode === 'alternativa' ? 'contained' : 'outlined'}
                      onClick={handleAddAlternative}
                      fullWidth
                      disabled={!currentDirection}
                      sx={{
                        backgroundColor: mode === 'alternativa' ?
                          (currentDirection === 'ida' ? COLORES.IDA.alternativa : COLORES.VUELTA.alternativa) :
                          'inherit',
                        color: mode === 'alternativa' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: mode === 'alternativa' ?
                            (currentDirection === 'ida' ? '#42a5f5' : '#ec407a') :
                            COLORES.FONDO,
                        }
                      }}
                    >
                      {mode === 'alternativa' ? 'Editando Alternativa' : 'Nueva Alternativa'}
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={currentDirection === 'ida' ? 'contained' : 'outlined'}
                      onClick={() => { setCurrentDirection('ida'); }}
                      fullWidth
                      sx={{
                        backgroundColor: currentDirection === 'ida' ? COLORES.IDA.principal : 'inherit',
                        color: currentDirection === 'ida' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: currentDirection === 'ida' ? '#1565c0' : COLORES.FONDO,
                        }
                      }}
                    >
                      Ruta Ida
                    </Button>
                    <Button
                      variant={currentDirection === 'vuelta' ? 'contained' : 'outlined'}
                      onClick={() => { setCurrentDirection('vuelta'); }}
                      fullWidth
                      disabled={!hasReturnRoute}
                      sx={{
                        backgroundColor: currentDirection === 'vuelta' ? COLORES.VUELTA.principal : 'inherit',
                        color: currentDirection === 'vuelta' ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: currentDirection === 'vuelta' ? '#c2185b' : COLORES.FONDO,
                        }
                      }}
                    >
                      Ruta Vuelta
                    </Button>
                  </Box>

                  {mode === 'parada' && (
                    <TextField
                      fullWidth
                      label="Nombre de la parada"
                      value={currentStopName}
                      onChange={(e) => { setCurrentStopName(e.target.value); }}
                      helperText="Escriba el nombre y luego haga click en el mapa"
                      sx={{
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: COLORES.PARADAS,
                        },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: COLORES.PARADAS,
                        }
                      }}
                    />
                  )}

                  {renderMainRoutesSection()}
                  {renderAlternativeRoutesSection()}
                  {renderStopsSection()}

                  <Box sx={{
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: 'background.paper',
                    pt: 2,
                    pb: 1,
                    zIndex: 1
                  }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleSaveRoute}
                        disabled={!routeName || rutaIda.length === 0 || (hasReturnRoute && rutaVuelta.length === 0)}
                        fullWidth
                        sx={{
                          backgroundColor: '#4caf50',
                          '&:hover': {
                            backgroundColor: '#388e3c'
                          }
                        }}
                      >
                        Guardar Ruta
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleClear}
                      >
                        Limpiar Todo
                      </Button>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ height: '500px', width: '100%' }}>
                <Map
  ref={mapRef}
  onMapClick={handleMapClick}
  routePoints={currentDirection === 'ida' ? rutaIda : rutaVuelta}
  alternativeRoute={currentDirection === 'ida' ? rutaAlternativaIda : rutaAlternativaVuelta}
  stopPoints={paradas}
  mode={mode}
  currentDirection={currentDirection}
/>

              </Box>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
