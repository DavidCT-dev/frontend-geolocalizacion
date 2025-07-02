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
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

const modalStyle = {
  position: 'absolute' as 'absolute',
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
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [vehicleName, setVehicleName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [drivers, setDrivers] = useState([]);
  const [driverReportData, setDriverReportData] = useState<any>(null);

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

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedDriver('');
    setVehicleName('');
    setLicensePlate('');
  };

  const handleOpenReportModal = () => setOpenReportModal(true);
  const handleCloseReportModal = () => {
    setOpenReportModal(false);
    setSelectedDriverForReport('');
    setSelectedMonth(dayjs().startOf('month'));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async () => {
    if (!selectedDriver || !vehicleName || !licensePlate) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/update-driver/${selectedDriver}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehiculo: vehicleName,
          matricula: licensePlate
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

  const fetchDriverReportData = async (driverId: string, month: Dayjs) => {
    try {
      setReportLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}reports/driver/${driverId}?month=${month.format('YYYY-MM')}`);
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error('Error al obtener los datos del reporte');
    } finally {
      setReportLoading(false);
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

              <Button
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
              </Button>
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
          <Box sx={modalStyle}>
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
                onChange={(e) => setSelectedDriver(e.target.value)}
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

              <TextField
                select
                fullWidth
                label="Tipo de vehículo"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                size="small"
              >
                <MenuItem value="MiniBus">MiniBus</MenuItem>
                <MenuItem value="MicroBus">MicroBus</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="N° Matrícula"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                size="small"
              />

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!selectedDriver || !vehicleName || !licensePlate || loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
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
                onChange={(e) => setSelectedDriverForReport(e.target.value)}
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
                    // Mantener el año actual pero cambiar solo el mes
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
