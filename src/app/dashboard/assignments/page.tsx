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
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { useUser } from "@/hooks/use-user";
dayjs.locale('es');

type AsignacionMatrix = boolean[][];

export default function Page(): JSX.Element {
  const [drivers, setDrivers] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionMatrix>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const { permissions } = useUser();

  const { control, watch, reset } = useForm({
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
    const dia = fecha.date(diaIndex + 1);
    const diaSemana = dia.day();
    const ultimoDigito = placa?.trim().slice(-1);
    if (!ultimoDigito || isNaN(+ultimoDigito)) return false;
    const restricciones: Record<number, string[]> = {
      1: ['1', '2'],
      2: ['3', '4'],
      3: ['5', '6'],
      4: ['7', '8'],
      5: ['9', '0'],
    };
    return restricciones[diaSemana]?.includes(ultimoDigito) ?? false;
  };

  const toggleCheckbox = (lineIndex: number, dayIndex: number) => {
    if (dayIndex !== 0 || !conductor) return;

    setAsignaciones((prev: any) => {
      const newAsignaciones = prev.map((fila: boolean[], i: number) => {
        const nuevaFila = [...fila];

        // Patrón diagonal \
        // Cada columna comienza una fila más abajo
        const debeSeleccionar = i === lineIndex;

        for (let d = 0; d < fila.length; d++) {
          if (tieneRestriccionPorPlaca(conductor.matricula, d, fechaInicio)) {
            nuevaFila[d] = false;
          } else {
            // Solo marcar true si está en la posición diagonal
            nuevaFila[d] = d === 0 && debeSeleccionar;
          }
        }
        return nuevaFila;
      });
      return newAsignaciones;
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
      if (!fechaInicio || !conductor) return;

      const asignacionesParaEnviar: any[] = [];
      lineas.forEach((ruta: any, rutaIndex: number) => {
        asignaciones[rutaIndex].forEach((asignado: boolean, diaIndex: number) => {
          if (asignado) {
            asignacionesParaEnviar.push({
              conductorId: conductor._id,
              rutaId: ruta._id,
              fecha: fechaInicio.date(diaIndex + 1).toDate()
            });
          }
        });
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/asignacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asignacionesParaEnviar),
      });

      if (!response.ok) throw new Error('Error al asignar');

      const result = await response.json();
      setSnackbar({
        open: true,
        message: `✅ ${result.creadas} creadas\n⚠️ ${result.existentes} ya existían`,
        severity: result.creadas > 0 ? 'success' : 'error',
      });

      reset();
      initializeAsignaciones(lineas, fechaInicio);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar las asignaciones');
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
    return Array.from({ length: daysInMonth }, (_, i) => (
      <TableCell key={`check-${lineIndex}-${i}`} align="center">
        <Checkbox
          checked={asignaciones[lineIndex]?.[i] || false}
          onChange={() => toggleCheckbox(lineIndex, i)}
          color="primary"
          disabled={loading || !conductor || i !== 0}
        />
      </TableCell>
    ));
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
                    alert('El conductor no tiene matrícula');
                  } else {
                    const dias = fechaInicio.daysInMonth();
                    const nuevasAsignaciones = lineas.map(() =>
                      Array.from({ length: dias }, (_, idx) => idx === 0)
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
                  <TableCell></TableCell>
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
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
}
