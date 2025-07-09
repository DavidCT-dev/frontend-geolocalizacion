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
    const parteNumerica = placa.split('-')[0];
    const ultimoDigito = parteNumerica.slice(-1);

    if (!/^\d+$/.test(parteNumerica)) return false;

    const dia = fecha.date(diaIndex + 1);
    const diaSemana = dia.day();

    // Restricciones (solo días laborables: lunes=1 a viernes=5)
    const restricciones: Record<number, string[]> = {
      1: ['0', '1'],  // Lunes
      2: ['2', '3'],  // Martes
      3: ['4', '5'],  // Miércoles
      4: ['6', '7'],  // Jueves
      5: ['8', '9'],  // Viernes
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

      const asignacionesParaEnviar: any[] = [];
      let totalAsignaciones = 0;
      let asignacionesConRestriccion = 0;

      lineas.forEach((ruta: any, rutaIndex: number) => {
        for (let diaIndex = 0; diaIndex < fechaInicio.daysInMonth(); diaIndex++) {
          if (asignaciones[rutaIndex]?.[diaIndex]) {
            // CORRECCIÓN: Usar directamente el día correcto (diaIndex + 1)
            const fechaAsignacion = fechaInicio.date(diaIndex + 1).startOf('day');

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
                fecha: fechaAsignacion.toISOString(),
                dia: diaIndex + 1, // Usamos directamente el día correcto
                diaSemana: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][fechaAsignacion.day()],
                mes: fechaInicio.month() + 1,
                año: fechaInicio.year()
              });
              totalAsignaciones++;
            } else {
              asignacionesConRestriccion++;
            }
          }
        }
      });

      // Resto del código permanece igual...
      console.log('Asignaciones a enviar:', asignacionesParaEnviar);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/asignacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        message: `✅ ${result.creadas} asignaciones creadas\n⚠️ ${result.existentes} ya existían\n🚫 ${asignacionesConRestriccion} con restricciones`,
        severity: 'success'
      });

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
      const diaNumero = i + 1; // Día real del mes (1-31)
      const sinMatricula = !conductor?.matricula;
      const restriccion = conductor?.matricula
        ? tieneRestriccionPorPlaca(conductor.matricula, i, date)
        : false;

      return (
        <TableCell key={`check-${lineIndex}-${i}`} align="center">
          <Checkbox
            checked={asignaciones[lineIndex]?.[i] || false}
            onChange={() => toggleCheckbox(lineIndex, i)}
            color="primary"
            disabled={loading || !conductor || sinMatricula || restriccion}
            title={
              sinMatricula ? 'El conductor no tiene matrícula registrada' :
                restriccion ? `Restricción: No circula los ${['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][date.date(diaNumero).day()]}s (placa ${conductor?.matricula})` :
                  `Día ${diaNumero} - ${date.date(diaNumero).format('dddd')}`
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
                  }
                  initializeAsignaciones(lineas, fechaInicio);
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

          {permissions?.includes('crear-asignacion') && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleAsignar}
              disabled={!fechaInicio || !conductor || loading}
            >
              {loading ? 'Enviando...' : 'Asignar'}
            </Button>
          )}
        </Box>

        {fechaInicio && (
          <TableContainer component={Paper}>
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
          </TableContainer>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ whiteSpace: 'pre-line' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
}
