'use client';
import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  CircularProgress
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Controller, useForm } from 'react-hook-form';
import { useUser } from '@/hooks/use-user';

dayjs.locale('es');

interface Jornada {
  fecha: string;
  lineaId: { nombre: string };
  horasTrabajadas: number;
}

export default function Page(): JSX.Element {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [totalHoras, setTotalHoras] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const { control, watch } = useForm({
    defaultValues: {
      fecha: dayjs(), // mes actual
    },
  });

  const fechaSeleccionada = watch("fecha");

  const getJornada = async () => {
    if (!fechaSeleccionada || !user?._id) return;

    const year = fechaSeleccionada.year();
    const month = String(fechaSeleccionada.month() + 1).padStart(2, '0'); // mes desde 0
    const fechaFormateada = `${year}-${month}`; // formato YYYY-MM

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/jornada/${user._id}/${fechaFormateada}`);
      const data = await res.json();
      setJornadas(data.jornadas || []);
      setTotalHoras(data.totalHorasTrabajadas || 0);
    } catch (err) {
      console.error("Error al obtener jornada:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fechaISO: string) => {
  const fechaUTC = new Date(fechaISO);
  const fechaLocal = new Date(fechaUTC.getTime() + fechaUTC.getTimezoneOffset() * 60000);

  const opcionesFecha: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  const opcionesDia: Intl.DateTimeFormatOptions = {
    weekday: 'long',
  };

  const fecha = fechaLocal.toLocaleDateString('es-BO', opcionesFecha);
  const dia = capitalizeFirstLetter(fechaLocal.toLocaleDateString('es-BO', opcionesDia));

  return { fecha, dia };
};

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Registro de jornada
        </Typography>

        <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={3}>
          <Controller
            name="fecha"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Mes"
                {...field}
                value={field.value}
                onChange={field.onChange}
                views={['year', 'month']}
                openTo="month"
                slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
                disabled={loading}
              />
            )}
          />

          <Button variant="contained" color="primary" onClick={getJornada} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Consultar'}
          </Button>

          {jornadas.length > 0 && (
            <Typography variant="subtitle1" ml={2}>
              Total horas trabajadas: <strong>{totalHoras.toFixed(2)} hrs</strong>
            </Typography>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TableContainer component={Paper} elevation={3}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>FECHA</TableCell>
                    <TableCell>DÍA</TableCell>
                    <TableCell>LÍNEA</TableCell>
                    <TableCell>HORAS TRABAJADAS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                   {jornadas.length > 0 ? (
    jornadas.map((jornada, index) => {
      const { dia, fecha } = formatFecha(jornada.fecha);
      return (
        <TableRow key={index}>
          <TableCell>{fecha}</TableCell>
          <TableCell>{dia}</TableCell>
          <TableCell>{jornada.lineaId?.nombre || '-'}</TableCell>
          <TableCell>{jornada.horasTrabajadas.toFixed(2)} hrs</TableCell>
        </TableRow>
      );
    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No hay datos para mostrar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}
