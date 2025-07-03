'use client';
import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useForm, Controller } from 'react-hook-form';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { useUser } from "@/hooks/use-user";

dayjs.locale('es');

interface FormValues {
  fechaInicio: Dayjs;
  conductor: {
    _id: string;
    nombre: string;
    matricula: string;
  } | null;
}

type AsignacionMatrix = boolean[][];

export default function Page(): JSX.Element {
  const [drivers, setDrivers] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionMatrix>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning',
  });
  const { permissions } = useUser();

  const { control, watch, reset } = useForm<FormValues>({
    defaultValues: {
      fechaInicio: dayjs(),
      conductor: null
    }
  });

  const fechaInicio = watch('fechaInicio');
  const conductor = watch('conductor');

  const getDrivers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/drivers`);
      const data = await response.json();
      const enabledDrivers = data.filter((driver: any) => !driver.deleted);
      setDrivers(enabledDrivers);
    } catch (error) {
      console.error('Error al obtener conductores:', error);
    }
  };

  const getLineas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas`);
      const data = await res.json();
      setLineas(data);
      initializeAsignaciones(data, fechaInicio);
    } catch (error) {
      console.error('Error al obtener líneas:', error);
    }
  };

  const initializeAsignaciones = (lineasData: any[], date: Dayjs) => {
    if (date && lineasData.length > 0) {
      const daysInMonth = date.daysInMonth();
      setAsignaciones(lineasData.map(() => Array(daysInMonth).fill(false)));
    }
  };

  const tieneRestriccionPorPlaca = (placa: string, diaIndex: number, fecha: Dayjs) => {
    if (!placa) return false;

    // Extraer el último dígito numérico antes del guión
    const parteNumerica = placa.split('-')[0]; // "1234" o "123"
    const ultimoDigito = parteNumerica.slice(-1); // último dígito numérico

    // Verificar si es un número válido (0-9)
    if (!/^\d+$/.test(parteNumerica)) return false;

    const dia = fecha.date(diaIndex + 1);
    const diaSemana = dia.day(); // 0=domingo, 1=lunes, ..., 6=sábado

    // Restricciones (solo días laborables: lunes=1 a viernes=5)
    const restricciones: Record<number, string[]> = {
      1: ['1', '2'],  // Lunes
      2: ['3', '4'],  // Martes
      3: ['5', '6'],  // Miércoles
      4: ['7', '8'],  // Jueves
      5: ['9', '0'],  // Viernes
    };

    return restricciones[diaSemana]?.includes(ultimoDigito) ?? false;
  };


  const toggleCheckbox = (lineIndex: number, dayIndex: number) => {
    if (dayIndex !== 0 || !conductor ) return;
    const dias = fechaInicio.daysInMonth(); // ✅ Se declara aquí

    const daysInMonth = fechaInicio.daysInMonth();
    const totalLineas = lineas.length;

    setAsignaciones(() => {
      const nuevasAsignaciones = lineas.map(() =>
        Array.from({ length: dias }, () => false)
      );

      let fila = lineIndex;

      for (let dia = 0; dia < daysInMonth; dia++) {
        const tieneRestriccion = tieneRestriccionPorPlaca(conductor.matricula, dia, fechaInicio);

        if (!tieneRestriccion) {
          nuevasAsignaciones[fila][dia] = true;
        }

        // Avanzar a la siguiente fila en forma circular
        fila = (fila + 1) % totalLineas;
      }

      return nuevasAsignaciones;
    });
  };



  useEffect(() => {
    getDrivers();
    getLineas();
  }, []);

  useEffect(() => {
    if (fechaInicio && lineas.length > 0) {
      initializeAsignaciones(lineas, fechaInicio);
    }
  }, [fechaInicio, lineas]);

  const handleAsignar = async () => {
  try {
    setLoading(true);

    // Validaciones básicas
    if (!fechaInicio || !conductor) {
      setSnackbar({
        open: true,
        message: 'Seleccione un conductor y un mes válido',
        severity: 'error'
      });
      return;
    }

    if (!conductor.matricula) {
      setSnackbar({
        open: true,
        message: 'El conductor no tiene matrícula registrada',
        severity: 'error'
      });
      return;
    }

    // Preparar datos para enviar
    const asignacionesParaEnviar: any[] = [];

    lineas.forEach((ruta: any, rutaIndex: number) => {
      asignaciones[rutaIndex].forEach((asignado: boolean, diaIndex: number) => {
        if (asignado) {
          const fechaAsignacion = fechaInicio.date(diaIndex + 1);

          // Verificar restricción por placa para esta fecha
          const tieneRestriccion = tieneRestriccionPorPlaca(
            conductor.matricula,
            diaIndex,
            fechaInicio
          );

          if (!tieneRestriccion) {
            asignacionesParaEnviar.push({
              conductorId: conductor._id,
              conductorNombre: conductor.nombre,
              conductorMatricula: conductor.matricula,
              rutaId: ruta._id,
              rutaNombre: ruta.nombre,
              fecha: fechaAsignacion.toDate(),
              dia: fechaAsignacion.date(),
              diaSemana: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][fechaAsignacion.day()]
            });
          }
        }
      });
    });

    // Validar que haya al menos una asignación
    if (asignacionesParaEnviar.length === 0) {
      setSnackbar({
        open: true,
        message: 'No hay días seleccionados válidos para asignar',
        severity: 'warning'
      });
      return;
    }

    // Enviar al backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/asignacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Si es necesario
      },
      body: JSON.stringify({
        conductor: {
          _id: conductor._id,
          nombre: conductor.nombre,
          matricula: conductor.matricula
        },
        asignaciones: asignacionesParaEnviar
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al asignar');
    }

    const result = await response.json();

    setSnackbar({
      open: true,
      message: `✅ ${result.creadas} asignaciones creadas\n⚠️ ${result.existentes} ya existían`,
      severity: 'success'
    });

    // Resetear selecciones
    initializeAsignaciones(lineas, fechaInicio);

  } catch (error) {
    console.error('Error:', error);
    setSnackbar({
      open: true,
      message: error instanceof Error ? error.message : 'Error al guardar las asignaciones',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};

  const generateDaysHeaders = (date: Dayjs) => Array.from({ length: date.daysInMonth() }, (_, i) => (
    <TableCell key={`day-${i}`} align="center">{i + 1}</TableCell>
  ));

  const generateDaysSubheaders = (date: Dayjs) => Array.from({ length: date.daysInMonth() }, (_, i) => (
    <TableCell key={`sub-${i}`} align="center">{date.date(i + 1).format('ddd').toLowerCase()}</TableCell>
  ));

  const generateDaysCheckboxes = (lineIndex: number, date: Dayjs) => {
  const daysInMonth = date.daysInMonth();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const sinMatricula = !conductor?.matricula;
    const restriccion = conductor?.matricula
      ? tieneRestriccionPorPlaca(conductor.matricula, i, date)
      : false;

    return (
      <TableCell key={`check-${lineIndex}-${i}`} align="center">
        <Checkbox
          checked={asignaciones[lineIndex]?.[i] || false}
          onChange={() => { toggleCheckbox(lineIndex, i); }}
          color="primary"
          disabled={loading || !conductor || sinMatricula || restriccion}
          title={
            sinMatricula ? 'El conductor no tiene matrícula registrada' :
            restriccion ? `Restricción: No circula los ${['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][date.date(i + 1).day()]}s (placa ${conductor?.matricula})` : ''
          }
        />
      </TableCell>
    );
  });
};


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>Asignaciones</Typography>

        <Box display="flex" gap={2} mb={3}>
          <Controller
            name="fechaInicio"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Mes"
                {...field}
                views={['year', 'month']}
                openTo="month"
                slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
                disabled={loading}
              />
            )}
          />

          <Controller
            name="conductor"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={drivers || []}
                getOptionLabel={(option: any) => option?.nombre || ''}
                value={drivers.find((d: any) => d._id === field.value?._id) || null}
                onChange={(_, newValue) => {
                  field.onChange(newValue);

                   if (!newValue?.matricula) {
      setSnackbar({
        open: true,
        message: 'El conductor seleccionado no tiene matrícula registrada',
        severity: 'error'
      });
      // Limpiar asignaciones y deshabilitar checkboxes
      setAsignaciones(lineas.map(() => Array(fechaInicio.daysInMonth()).fill(false)));
                  } else {
                    const dias = fechaInicio.daysInMonth(); // ✅ esta línea es necesaria
                    const nuevasAsignaciones = lineas.map(() =>
                      Array.from({ length: dias }, () => false) // ✅ sin asignar por defecto
                    );
                    setAsignaciones(nuevasAsignaciones);
                  }
                }}
                isOptionEqualToValue={(option: any, value: any) => option._id === value?._id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Seleccionar conductor"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                sx={{ minWidth: 300 }}
                disabled={loading}
              />
            )}
          />


          {permissions?.includes('crear-asignacion') ? <Button
              variant="contained"
              color="primary"
              onClick={handleAsignar}
              disabled={!fechaInicio || !conductor || loading}
            >
              {loading ? 'Enviando...' : 'Asignar'}
            </Button> : null}
        </Box>

        {fechaInicio ? <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>LÍNEA</TableCell>
                  {generateDaysHeaders(fechaInicio)}
                </TableRow>
                <TableRow>
                  <TableCell />
                  {generateDaysSubheaders(fechaInicio)}
                </TableRow>
              </TableHead>
              <TableBody>
                {lineas.map((linea: any, i) => (
                  <TableRow key={i}>
                    <TableCell>{linea.nombre}</TableCell>
                    {generateDaysCheckboxes(i, fechaInicio)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer> : null}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => { setSnackbar(prev => ({ ...prev, open: false })); }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => { setSnackbar(prev => ({ ...prev, open: false })); }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
}
