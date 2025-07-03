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
  TablePagination,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useForm, Controller } from 'react-hook-form';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { jsPDF } from 'jspdf';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import Modal from '@mui/material/Modal';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import autoTable from 'jspdf-autotable';

dayjs.locale('es');

interface Driver {
  _id: string;
  nombre: string;
  deleted?: boolean;
}

interface Ruta {
  _id: string;
  nombre: string;
}

interface Asignacion {
  _id: string;
  conductorId?: {
    _id: any;
    nombre: string;
  };
  rutaId?: {
    _id?:string
    nombre: string;
  };
  fecha: string;
}

interface FormValues {
  fechaInicio: Dayjs;
  search: Driver | null;
}

export default function Page(): JSX.Element {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [filteredAsignaciones, setFilteredAsignaciones] = useState<Asignacion[]>([]);
  const [selectedAsignaciones, setSelectedAsignaciones] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [rutaFilter, setRutaFilter] = useState<string | null>(null);
  const [asignacionesToDelete, setAsignacionesToDelete] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [asignacionEdit, setAsignacionEdit] = useState<Asignacion | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [openReportModal, setOpenReportModal] = useState(false);
  const [reportMonth, setReportMonth] = useState<Dayjs>(dayjs());
  const [selectedRutaForReport, setSelectedRutaForReport] = useState<string | null>(null);

  // Función para abrir el modal de edición
  const handleOpenEditModal = (asignacion: Asignacion) => {
    setAsignacionEdit(asignacion);
    setOpenModal(true);
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setAsignacionEdit(null);
  };
  const open = Boolean(anchorEl);

  const { control, watch } = useForm<FormValues>({
    defaultValues: {
      fechaInicio: dayjs(),
      search: null
    }
  });

  const handleSelectForDeletion = (asignacionId: string) => {
    setAsignacionesToDelete(prev =>
      prev.includes(asignacionId)
        ? prev.filter(id => id !== asignacionId)
        : [...prev, asignacionId]
    );
  };

  const handleDeleteSelected = async () => {
    if (asignacionesToDelete.length === 0) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/asignaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: asignacionesToDelete }),
      });

      if (!response.ok) throw new Error('Error al eliminar asignaciones');

      setSnackbar({
        open: true,
        message: `${asignacionesToDelete.length} asignación(es) eliminada(s) correctamente`,
        severity: 'success',
      });

      // Actualizar la lista después de eliminar
      await getAsignaciones();

      setAsignacionesToDelete([]);
    } catch (error) {
      console.error('Error al eliminar:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar asignaciones',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fechaInicio = watch('fechaInicio');
  const search = watch('search');

  // Manejar cambio de página
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Manejar búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Resetear a primera página al buscar
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };


  // Obtener conductores
  const getDrivers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/drivers`);
      const data = await response.json();
      const enabledDrivers = data.filter((driver: Driver) => !driver.deleted);
      setDrivers(enabledDrivers);
    } catch (error) {
      console.error('Error al obtener conductores:', error);
    }
  };

  // Obtener rutas
  const getRutas = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas`);
      const data = await response.json();
      setRutas(data);
    } catch (error) {
      console.error('Error al obtener rutas:', error);
    }
  };

  // Obtener asignaciones
  const getAsignaciones = async () => {
    if (!fechaInicio) return;
    setLoading(true);
    setSelectedAsignaciones([]); // Limpiar selecciones al hacer nueva consulta
    try {
      const fecha = fechaInicio.startOf('month').format('YYYY-MM-DD');
      const conductorId: string | undefined = search?._id;
      let url = `${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/asignacion?fecha=${fecha}`;

      if (conductorId) {
        url += `&conductorId=${conductorId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setAsignaciones(data);
      setFilteredAsignaciones(data); // Inicialmente mostrar todas
    } catch (error) {
      console.error('Error al obtener asignaciones:', error);
      setSnackbar({ open: true, message: 'Error al consultar asignaciones', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let result = [...asignaciones];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
      (item.conductorId?.nombre?.toLowerCase().includes(term) ||
        item.rutaId?.nombre?.toLowerCase().includes(term) ||
        dayjs(item.fecha).format('YYYY-MM-DD').includes(term))
      );
    }

    // Filtrar por ruta
    if (rutaFilter) {
      result = result.filter((item: any) => item.rutaId?._id === rutaFilter);
    }

    setFilteredAsignaciones(result);
    setPage(0); // Resetear a primera página al aplicar filtros
  }, [asignaciones, searchTerm, rutaFilter]);


  useEffect(() => {
    getDrivers();
    getRutas();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Calcular asignaciones visibles
  const visibleAsignaciones = filteredAsignaciones.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleUpdateAsignacion = async () => {
    if (!asignacionEdit?.conductorId) return;

    try {
      setEditLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/asignacion/${asignacionEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          asignacionEdit
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(data)
        throw new Error(data.message || 'Error al actualizar la asignación');
      }

      setSnackbar({
        open: true,
        message: data.message || 'Asignación actualizada correctamente',
        severity: 'success'
      });

      handleCloseModal();
      await getAsignaciones();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Error al actualizar la asignación',
        severity: 'error'
      });
    } finally {
      setEditLoading(false);
    }
  };

  const generateReport = async (month: Dayjs, rutaId: string | null) => {
  try {
    setLoading(true);

    const monthFormatted = month.format('YYYY-MM');
    let url = `${process.env.NEXT_PUBLIC_API_URL_BACK}rutas/lineas?month=${monthFormatted}`;
    if (rutaId) url += `&lineaId=${rutaId}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener datos del reporte');

    const data = await response.json();
    if (!data?.asignaciones?.length) {
      setSnackbar({
        open: true,
        message: 'No hay datos para el reporte',
        severity: 'error'
      });
      return;
    }

    // Crear PDF en modo vertical (portrait)
    const doc = new jsPDF('p', 'mm', 'a4');

    // Título principal
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE MENSUAL DE ASIGNACIONES', 105, 20, { align: 'center' });

    // Subtítulo
    doc.setFontSize(12);
    doc.text(`Periodo: ${month.format('MMMM YYYY')}`, 105, 28, { align: 'center' });

    // Info de línea si aplica
    if (rutaId && data.linea) {
      doc.setFontSize(10);
      doc.text(`Línea asignada: ${data.linea.nombre}`, 105, 35, { align: 'center' });
    }

    // Procesar datos para la tabla
    const daysInMonth = month.daysInMonth();
    const assignmentsByDay: Record<number, string[]> = {};

    Array.from({ length: daysInMonth }, (_, i) => i + 1).forEach(day => {
      assignmentsByDay[day] = [];
    });

    data.asignaciones.forEach((item: any) => {
      const day = dayjs(item.fecha).date();
      if (assignmentsByDay[day]) {
        assignmentsByDay[day].push(item.conductorId?.nombre || 'Sin asignar');
      }
    });

    // Preparar datos para tabla
    const tableData: string[][] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = month.date(day);
      const dayName = date.format('ddd').toUpperCase();
      const dateStr = date.format('DD/MM');

      tableData.push([
        day.toString(),
        `${dayName} ${dateStr}`,
        assignmentsByDay[day].join('\n') || '--'
      ]);
    }

    // Generar tabla
    autoTable(doc, {
      startY: 40,
      head: [
        [
          {
            content: 'DÍA',
            styles: {
              fillColor: [100, 100, 100],
              textColor: 255,
              fontStyle: 'bold' as const,
              halign: 'center' as const
            }
          },
          {
            content: 'FECHA',
            styles: {
              fillColor: [100, 100, 100],
              textColor: 255,
              fontStyle: 'bold' as const,
              halign: 'center' as const
            }
          },
          {
            content: 'CONDUCTORES',
            styles: {
              fillColor: [100, 100, 100],
              textColor: 255,
              fontStyle: 'bold' as const,
              halign: 'center' as const
            }
          }
        ]
      ],
      body: tableData.map(row => [
        {
          content: row[0],
          styles: {
            fontStyle: 'normal' as const,
            halign: 'center' as const
          }
        },
        {
          content: row[1],
          styles: {
            fontStyle: 'normal' as const,
            halign: 'left' as const
          }
        },
        {
          content: row[2],
          styles: {
            fontStyle: 'normal' as const,
            halign: 'left' as const
          }
        }
      ]),
      columnStyles: {
        0: {
          cellWidth: 15,
          halign: 'center' as const,
          fontStyle: 'bold' as const
        },
        1: {
          cellWidth: 25,
          halign: 'left' as const
        },
        2: {
          cellWidth: 'auto',
          cellPadding: 2,
          halign: 'left' as const
        }
      },
      styles: {
        fontSize: 8,
        cellPadding: 1,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        overflow: 'linebreak' as const,
        fontStyle: 'normal' as const,
        halign: 'left' as const
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'wrap' as const,
      pageBreak: 'avoid' as const
    });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generado el: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 20, 285);
    doc.text('Sistema de Gestión de Transporte', 190, 285, { align: 'right' });

    // Mostrar PDF en nueva pestaña
    const pdfOutput = doc.output('bloburl');
    window.open(pdfOutput, '_blank');
  } catch (error) {
    console.error('Error al generar reporte:', error);
    setSnackbar({
      open: true,
      message: 'Error al generar el reporte',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};



  return (

    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Lista de Asignaciones
        </Typography>

        {/* Filtros principales */}
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={3}>
          <Controller
            name="fechaInicio"
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

          <Controller
            name="search"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={drivers}
                getOptionLabel={(option: Driver) => option.nombre || ''}
                value={field.value}
                onChange={(_, data) => { field.onChange(data); }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrar por conductor"
                    size="small"
                    variant="outlined"
                    placeholder="Seleccione conductor"
                  />
                )}
                sx={{ minWidth: 200 }}
                disabled={loading}
              />
            )}
          />

          <Button variant="contained" color="primary" onClick={getAsignaciones}>
            {loading ? 'Consultando...' : 'Consultar'}
          </Button>

          <Button
            variant="contained"
            color="secondary"
            onClick={() => { setOpenReportModal(true); }}
          >
            Generar Reporte
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelected}
            disabled={asignacionesToDelete.length === 0 || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            sx={{
              ml: 2,
              minWidth: 120,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: asignacionesToDelete.length > 0 ? 'scale(1.03)' : 'none',
                boxShadow: asignacionesToDelete.length > 0 ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                color: 'rgba(0, 0, 0, 0.26)',
              }
            }}
          >
            {loading ? (
              'Eliminando...'
            ) : (
              <>
                Eliminar
                {asignacionesToDelete.length > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {asignacionesToDelete.length}
                  </Box>
                )}
              </>
            )}
          </Button>
        </Box>

        {/* Barra de búsqueda y exportación */}
        <Box display="flex" justifyContent="space-between" mb={2}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: '400px' }}
          />

          <Autocomplete
            options={rutas}
            getOptionLabel={(option: Ruta) => option.nombre || ''}
            value={rutas.find(r => r._id === rutaFilter) || null}
            onChange={(_, newValue) => { setRutaFilter(newValue?._id || null); }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filtrar por línea"
                size="small"
                variant="outlined"
                placeholder="Seleccione línea"
              />
            )}
            sx={{ minWidth: 300 }}
            disabled={loading}
          />



        </Box>

        {/* Tabla de asignaciones */}
        <TableContainer component={Paper}>
          {filteredAsignaciones.length > 0 ? (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={
                          asignacionesToDelete.length > 0 &&
                          asignacionesToDelete.length < filteredAsignaciones.length
                        }
                        checked={
                          filteredAsignaciones.length > 0 &&
                          asignacionesToDelete.length === filteredAsignaciones.length
                        }
                        onChange={() => {
                          if (asignacionesToDelete.length === filteredAsignaciones.length) {
                            setAsignacionesToDelete([]);
                          } else {
                            setAsignacionesToDelete(filteredAsignaciones.map(a => a._id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell><strong>Conductor</strong></TableCell>
                    <TableCell><strong>Línea</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Acciones</strong></TableCell>

                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleAsignaciones.map((item: Asignacion) => (
                    <TableRow key={item._id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={asignacionesToDelete.includes(item._id)}
                          onChange={() => { handleSelectForDeletion(item._id); }}
                        />
                      </TableCell>
                      <TableCell>{item.conductorId?.nombre || '-'}</TableCell>
                      <TableCell>{item.rutaId?.nombre || '-'}</TableCell>
                      <TableCell>{dayjs(item.fecha).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => { handleOpenEditModal(item); }}
                          disabled={dayjs(item.fecha).isBefore(dayjs(), 'day')}
                          startIcon={<EditIcon />}
                          sx={{
                            ml: 1,
                            textTransform: 'none',
                            minWidth: '120px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            },
                            '&.Mui-disabled': {
                              backgroundColor: 'rgba(0, 0, 0, 0.12)',
                              color: 'rgba(0, 0, 0, 0.26)',
                            }
                          }}
                        >
                          Reasignar
                        </Button>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredAsignaciones.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          ) : (
            <Typography p={3} color="text.secondary">
              {asignaciones.length === 0
                ? 'No hay asignaciones registradas para el mes seleccionado.'
                : 'No se encontraron resultados con los filtros aplicados.'}
            </Typography>
          )}
        </TableContainer>



        {/* Modal para generar reporte */}
        <Modal
          open={openReportModal}
          onClose={() => { setOpenReportModal(false); }}
          aria-labelledby="modal-generar-reporte"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" component="h2">
                Configurar Reporte
              </Typography>
              <IconButton onClick={() => { setOpenReportModal(false); }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box mb={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Mes del reporte"
                  value={reportMonth}
                  onChange={(newValue) => newValue && setReportMonth(newValue)}
                  views={['year', 'month']}
                  openTo="month"
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Box>

            <Box mb={3}>
              <Autocomplete
                options={rutas}
                getOptionLabel={(option: Ruta) => option.nombre}
                value={rutas.find(r => r._id === selectedRutaForReport) || null}
                onChange={(_, newValue) => { setSelectedRutaForReport(newValue?._id || null); }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrar por línea (opcional)"
                    fullWidth
                  />
                )}
              />
            </Box>

            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button
                variant="outlined"
                onClick={() => { setOpenReportModal(false); }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // Lógica para generar el reporte con los filtros seleccionados
                  generateReport(reportMonth, selectedRutaForReport);
                  setOpenReportModal(false);
                }}
              >
                Generar
              </Button>
            </Box>
          </Box>
        </Modal>



        <Modal
          open={openModal}
          onClose={handleCloseModal}
          aria-labelledby="modal-editar-asignacion"
          aria-describedby="modal-para-editar-asignacion"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" component="h2">
                Reasignar conductor
              </Typography>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>

            {asignacionEdit ? <>
                {/* Campo para seleccionar línea */}
                <Box mb={2}>
                  <Autocomplete
                    options={rutas}
                    getOptionLabel={(option: any) => option.nombre}
                    value={rutas.find((l: any) => l._id === asignacionEdit.rutaId?._id) || null}
                    onChange={(_, newValue) => {
                      setAsignacionEdit((prev) => ({
                        ...prev!,
                        rutaId: newValue ? { _id: newValue._id, nombre: newValue.nombre } : undefined
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Seleccionar línea" fullWidth />
                    )}
                  />
                </Box>

                {/* Campo para seleccionar nuevo conductor */}
                <Autocomplete
                  options={drivers}
                  getOptionLabel={(option: Driver) => option.nombre}
                  value={drivers.find((d: any) => d._id === asignacionEdit.conductorId?._id) || null}
                  disabled
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Seleccionar conductor"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                />

                {/* Botones de acción */}
                <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                  <Button variant="outlined" onClick={handleCloseModal} disabled={editLoading}>
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={editLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleUpdateAsignacion}
                    disabled={editLoading || !asignacionEdit?.conductorId}
                    sx={{
                      minWidth: '150px',
                      '& .MuiButton-startIcon': {
                        marginRight: '8px'
                      }
                    }}
                  >
                    {editLoading ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </Box>
              </> : null}
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
