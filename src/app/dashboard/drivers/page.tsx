'use client';
import { Box, Button, Modal, TextField, Typography, Stack, MenuItem, Card, CardContent, IconButton, Snackbar, Alert } from "@mui/material";
import React, { useEffect, useState } from "react";
import TableDriver from "@/components/user-tables/my-table-driver";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { driverSchema } from '../../../schemas'
dayjs.locale('es');
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function Page(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedDriverForReport, setSelectedDriverForReport] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<any>(dayjs().startOf('month'));
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [drivers, setDrivers] = useState([]);


  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      vehiculo: '',
      matricula: ''
    }
  });



  const getDrivers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/drivers`);
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al cargar los conductores',
        severity: 'error',
      });
    }
  };

  useEffect(() => {
    getDrivers();
  }, []);

  const tableHeader: string[] = ['NOMBRE', 'CI', 'TELÉFONO', 'CORREO', 'DESCRIPCIÓN VEHÍCULO', 'N° MATRÍCULA', 'MODIFICAR'];

  const handleOpen = () => { setOpen(true); };
  const handleClose = () => {
    setOpen(false);
    setSelectedDriver('');
    reset({ vehiculo: '', matricula: '' }); // Resetea el formulario
  };

  const handleOpenReportModal = () => { setOpenReportModal(true); };
  const handleCloseReportModal = () => {
    setOpenReportModal(false);
    setSelectedDriverForReport('');
    setSelectedMonth(dayjs().startOf('month'));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const onSubmit = async (formData: any) => {
    if (!selectedDriver) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/update-driver/${selectedDriver}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehiculo: formData.vehiculo,  // Usa los valores del formulario
          matricula: formData.matricula
        }),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Conductor actualizado correctamente',
          severity: 'success',
        });
        getDrivers();
        handleClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el conductor');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al actualizar el conductor',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };


  const generatePDF = async () => {
    if (!selectedMonth) return;

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL_BACK}user/jornada?month=${selectedMonth.format('YYYY-MM')}${selectedDriverForReport ? `&conductorId=${selectedDriverForReport}` : ''
        }`;

      const response = await fetch(url);
      const reportData = await response.json();

      const doc = new jsPDF();

      // Configuración inicial
      doc.setFontSize(18);
      doc.text('Informe Mensual de Jornadas', 14, 20);
      doc.setFontSize(12);
      doc.text(`Mes: ${selectedMonth.format('MMMM YYYY')}`, 14, 30);

      // Datos del conductor si está seleccionado
      if (reportData.conductor) {
        doc.text(`Nombre: ${reportData.conductor.nombre}`, 14, 40);
        doc.text(`CI: ${reportData.conductor.ci}`, 14, 48);
        doc.text(`Vehículo: ${reportData.conductor.vehiculo || 'Sin dato'}`, 14, 56);
        doc.text(`Matrícula: ${reportData.conductor.matricula || 'Sin dato'}`, 14, 64);
      }

      // Tabla de jornadas
      if (reportData.jornadas && reportData.jornadas.length > 0) {
        autoTable(doc, {
          startY: reportData.conductor ? 74 : 40,
          head: [['Fecha', 'Línea', 'Hora Inicio', 'Hora Fin', 'Horas Trabajadas', 'Vueltas']],
          body: reportData.jornadas.map((jornada: any) => [
            dayjs(jornada.fecha).format('DD/MM/YYYY'),
            jornada.lineaId.nombre,
            jornada.hora_inicio ? dayjs(jornada.hora_inicio).format('HH:mm') : '--',
            jornada.hora_fin ? dayjs(jornada.hora_fin).format('HH:mm') : '--',
            jornada.horasTrabajadas?.toFixed(2) || '0',
            jornada.numeroVueltas || '0'
          ]),
          styles: {
            halign: 'left',
            cellPadding: 5,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          }
        });

        // Resumen
        const finalY = (doc as any).lastAutoTable.finalY || 80;
        doc.text(`Total de vueltas: ${reportData.totalVueltas}`, 14, finalY + 10);
        doc.text(`Total de horas trabajadas: ${reportData.totalHoras.toFixed(2)}`, 14, finalY + 18);
      } else {
        doc.text('No hay jornadas registradas para este mes', 14, reportData.conductor ? 74 : 40);
      }

      // Abrir PDF en nueva pestaña
      const pdfUrl = doc.output('bloburl');
      window.open(pdfUrl, '_blank');
      handleCloseReportModal();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al generar el reporte',
        severity: 'error',
      });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
        <Card sx={{ p: 2 }}>
          <CardContent sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px'
          }}>
            <Typography variant="h4" sx={{
              fontWeight: 600,
              color: 'text.primary'
            }}>
              Conductor - Vehículo
            </Typography>

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpen}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    boxShadow: 'none'
                  }
                }}
              >
                Actualizar conductor
              </Button>

              {/* <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleOpenReportModal}
                sx={{
                  backgroundColor: 'secondary.main',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                    boxShadow: 'none'
                  }
                }}
              >
                Generar reporte
              </Button> */}
            </Box>
          </CardContent>
        </Card>

        <TableDriver
          count={drivers.length}
          page={0}
          headerTable={tableHeader}
          rows={drivers}
          rowsPerPage={5}
          getDrivers={getDrivers}
        />

        {/* Modal para actualizar conductor */}
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box
            sx={modalStyle}
            component="form"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5">Asignar Vehículo a Conductor</Typography>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={3}>
              <TextField
                select
                value={selectedDriver}
                onChange={(e) => { setSelectedDriver(e.target.value); }}
                label="Seleccionar conductor"
                fullWidth
                size="small"
              >
                <MenuItem value="" disabled>
                  Seleccione un conductor
                </MenuItem>
                {drivers.map((driver: any) => (
                  <MenuItem key={driver._id} value={driver._id}>
                    {driver.nombre} - {driver.ci}
                  </MenuItem>
                ))}
              </TextField>

              <Controller
                name="vehiculo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Tipo de vehículo"
                    size="small"
                    error={Boolean(errors.vehiculo)}
                    helperText={errors.vehiculo?.message}
                  >
                    <MenuItem value="MiniBus">MiniBus</MenuItem>
                    <MenuItem value="MicroBus">MicroBus</MenuItem>
                  </TextField>
                )}
              />

              <Controller
                name="matricula"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="N° Matrícula"
                    size="small"
                    error={Boolean(errors.matricula)}
                    helperText={errors.matricula?.message || "Formato: 1234-ABC o ABC-123"}
                    onChange={(e) => {
                      // Eliminar espacios y convertir a mayúsculas
                      const value = e.target.value.replace(/\s/g, '').toUpperCase();
                      field.onChange(value);
                    }}
                    inputProps={{
                      maxLength: 8,
                    }}
                  />
                )}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={!selectedDriver || isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </Stack>
          </Box>
        </Modal>

        {/* Modal para generar reporte */}
        <Modal
          open={openReportModal}
          onClose={handleCloseReportModal}
          aria-labelledby="report-modal-title"
          aria-describedby="report-modal-description"
        >
          <Box sx={modalStyle}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5">Generar Reporte Mensual</Typography>
              <IconButton onClick={handleCloseReportModal}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={3}>
              <TextField
                select
                value={selectedDriverForReport}
                onChange={(e) => { setSelectedDriverForReport(e.target.value); }}
                label="Seleccionar conductor"
                fullWidth
                size="small"
              >
                <MenuItem value="" disabled>
                  Seleccione un conductor
                </MenuItem>
                {drivers.map((driver: any) => (
                  <MenuItem key={driver._id} value={driver._id}>
                    {driver.nombre} - {driver.ci}
                  </MenuItem>
                ))}
              </TextField>

              <DatePicker
                views={['month']}
                openTo="month"
                label="Seleccionar mes"
                minDate={dayjs('2020-01-01')}
                maxDate={dayjs().endOf('month')}
                value={selectedMonth}
                onChange={(newValue) => {
                  if (newValue) {
                    const adjustedMonth = selectedMonth
                      ? selectedMonth.month(newValue.month())
                      : dayjs().month(newValue.month()).startOf('month');
                    setSelectedMonth(adjustedMonth);
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />

              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={generatePDF}
                disabled={!selectedMonth || reportLoading}
                sx={{
                  backgroundColor: 'secondary.main',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                    boxShadow: 'none'
                  },
                  '&:disabled': {
                    backgroundColor: 'action.disabled',
                    color: 'text.disabled'
                  }
                }}
              >
                {reportLoading ? 'Generando...' : 'Generar reporte'}
              </Button>
            </Stack>
          </Box>
        </Modal>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
