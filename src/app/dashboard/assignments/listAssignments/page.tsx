'use client';
import { Box, Button, Modal, TextField, Typography, Stack, MenuItem, Card, CardContent, IconButton, Snackbar, Alert } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useEffect, useState } from "react";
import TableDriver from "@/components/user-tables/my-table-driver";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [selectedDriver, setSelectedDriver] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [drivers, setDrivers] = useState([]);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedDriverForPdf, setSelectedDriverForPdf] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

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

  const generatePDF = (driverData: any) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Información del Conductor', 14, 20);

    doc.setFontSize(12);
    doc.text(`Nombre: ${driverData.nombre}`, 14, 30);
    doc.text(`CI: ${driverData.ci}`, 14, 38);
    doc.text(`Teléfono: ${driverData.telefono}`, 14, 46);
    doc.text(`Email: ${driverData.email}`, 14, 54);
    doc.text(`Vehículo: ${driverData.vehiculo || 'Sin dato'}`, 14, 62);
    doc.text(`Matrícula: ${driverData.matricula || 'Sin dato'}`, 14, 70);

    // Añadir mes seleccionado al PDF
    if (selectedMonth) {
      const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
      doc.text(`Reporte del mes: ${monthName}`, 14, 78);
    }

    autoTable(doc, {
      startY: selectedMonth ? 88 : 80,
      head: [['Campo', 'Valor']],
      body: [
        ['Nombre', driverData.nombre],
        ['CI', driverData.ci],
        ['Teléfono', driverData.telefono],
        ['Email', driverData.email],
        ['Vehículo', driverData.vehiculo || 'Sin dato'],
        ['Matrícula', driverData.matricula || 'Sin dato']
      ],
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

    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
  };

  const handleOpenPdfModal = () => setPdfModalOpen(true);
  const handleClosePdfModal = () => {
    setPdfModalOpen(false);
    setSelectedDriverForPdf('');
    setSelectedMonth(null);
  };

  const handleGeneratePdfWithParams = () => {
    if (!selectedDriverForPdf || !selectedMonth) return;

    const driverData = drivers.find((driver: any) => driver._id === selectedDriverForPdf);
    if (driverData) {
      generatePDF(driverData);
      handleClosePdfModal();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
        <Card sx={{ p: 2 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">Conductor - Vehiculo</Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpen}
              >
                Actualizar
              </Button>
            </Box>
            <IconButton
              color="secondary"
              onClick={handleOpenPdfModal}
              aria-label="generar pdf"
            >
              <PictureAsPdfIcon />
            </IconButton>
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

        {/* Modal para generación de PDF */}
        <Modal
          open={pdfModalOpen}
          onClose={handleClosePdfModal}
          aria-labelledby="pdf-modal-title"
          aria-describedby="pdf-modal-description"
        >
          <Box sx={modalStyle}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5">Generar Reporte PDF</Typography>
              <IconButton onClick={handleClosePdfModal}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={3}>
              <TextField
                select
                value={selectedDriverForPdf}
                onChange={(e) => setSelectedDriverForPdf(e.target.value)}
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
                label="Mes"
                value={selectedMonth}
                onChange={(newValue) => setSelectedMonth(newValue)}
                views={['year', 'month']}
                openTo="month"
                slotProps={{
                  textField: {
                    size: 'small',
                    variant: 'outlined',
                    fullWidth: true
                  }
                }}
                disabled={loading}
              />

              <Button
                variant="contained"
                onClick={handleGeneratePdfWithParams}
                disabled={!selectedDriverForPdf || !selectedMonth}
                startIcon={<PictureAsPdfIcon />}
              >
                Generar PDF
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
