'use client';

import {
  Avatar, Box, Button, Card, Divider, Stack, Table, TableBody,
  TableCell, TableHead, TablePagination, TableRow, Typography, TextField,
  InputAdornment, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, Alert,
  Modal,
  MenuItem
} from "@mui/material";
import * as React from "react";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useSelection } from '@/hooks/use-selection';
import { type GeneralUser } from "@/types/generalUser";
import { type Driver } from "@/types/driver";
import { useUser } from "@/hooks/use-user";
import { driverSchema } from '../../schemas'
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

function noop(): void { }

interface MyTableProps {
  count?: number;
  page?: number;
  headerTable: string[];
  rows?: GeneralUser[] | Driver[];
  rowsPerPage?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
  onSearch?: (searchTerm: string) => void;
  onDeleteSuccess?: () => void; // Callback after successful deletion
  getDrivers?: () => void;
}

export default function TableDriver({
  count = 0,
  rows = [],
  page = 0,
  headerTable,
  rowsPerPage = 0,
  onPageChange = noop,
  onRowsPerPageChange = noop,
  onSearch,
  onDeleteSuccess,
  getDrivers,
}: MyTableProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredRows, setFilteredRows] = React.useState<(GeneralUser | Driver)[]>(rows);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { checkSession, permissions } = useUser();

  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });


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

  const rowIds = React.useMemo(() => {
    return rows.map((user) => user.id);
  }, [rows]);

  const { selected } = useSelection(rowIds);

  React.useEffect(() => {
    if (!onSearch) {
      const filtered = rows.filter(row =>
        Object.values(row).some(
          value => value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ));
      setFilteredRows(filtered);
    }
  }, [searchTerm, rows, onSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleEdit = (userId: string, rowData: any) => {
     setCurrentUserId(userId);
  setEditModalOpen(true);

     reset({
    vehiculo: rowData.vehiculo || '',
    matricula: rowData.matricula || ''
  });
    setEditModalOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Usuario Eliminado correctamente',
          severity: 'success',
        });
        getDrivers?.()

        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete user',
        severity: 'error',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const displayRows = onSearch ? rows : filteredRows;

  const handleCloseEdit = () => {
    setEditModalOpen(false);
  };


  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/update-driver/${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Usuario actualizado correctamente',
          severity: 'success',
        });
        getDrivers?.()
        await checkSession?.();
        handleCloseEdit();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el usuario');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al actualizar el usuario',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  const vehicleOptions = [
    { value: 'MiniBus', label: 'MiniBus' },
    { value: 'MicroBus', label: 'MicroBus' }
  ];

  return (
    <Card>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          sx={{ width: '300px' }}
        />
      </Box>

      <Divider />

      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              {headerTable.map((header, index) => (
                <TableCell key={index}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.map((row) => {
              const isSelected = selected?.has(row.id);

              return (
                <TableRow hover key={row.id} selected={isSelected}>
                  <TableCell>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                      <Avatar src={row.avatar} />
                      <Typography variant="subtitle2">{row.nombre}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{row.ci}</TableCell>
                  <TableCell>{row.telefono}</TableCell>

                  <TableCell>{row.email}</TableCell>

                  <TableCell>
                    <Typography color={row?.vehiculo ? 'inherit' : 'text.secondary'}>
                      {row?.vehiculo as any || 'Sin dato'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color={row?.matricula ? 'inherit' : 'text.secondary'}>
                      {row?.matricula as any || 'Sin dato'}
                    </Typography>
                  </TableCell>



                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {permissions?.includes('editar-conductor') ? <IconButton
                          color="primary"
                          onClick={() => { handleEdit(row._id as any, row); }}
                          aria-label="editar"
                        >
                          <EditIcon />
                        </IconButton> : null}

                      {permissions?.includes('eliminar-conductor') ? <IconButton
                          color="error"
                          onClick={() => { handleDeleteClick(row._id as any); }}
                          aria-label="eliminar"
                        >
                          <DeleteIcon />
                        </IconButton> : null}


                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      <Divider />

      <TablePagination
        component="div"
        count={onSearch ? count : displayRows.length}
        onPageChange={(event, newPage) => { onPageChange(newPage); }}
        onRowsPerPageChange={(event) =>
          { onRowsPerPageChange(parseInt(event.target.value, 10)); }
        }
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar este usuario?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); }}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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




      {/* Modal para editar usuario */}
      <Modal open={editModalOpen} onClose={handleCloseEdit}>
        <Box
          sx={modalStyle}
          component="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Typography variant="h6" mb={3}>Editar Conductor</Typography>
          <Stack spacing={2}>
            {/* Campo Tipo de Vehículo (Select) */}
            <Controller
              name="vehiculo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Tipo de vehículo"
                  variant="outlined"
                  error={Boolean(errors.vehiculo)}
                  helperText={errors.vehiculo?.message}
                >
                  {vehicleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Campo Matrícula */}
            <Controller
              name="matricula"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="N° Matrícula"
                  variant="outlined"
                  error={Boolean(errors.matricula)}
                  helperText={errors.matricula?.message || "Formato: 1234-ABC o ABC-123"}
                  onChange={(e) => {
                    // Eliminar espacios y convertir a mayúsculas
                    const value = e.target.value.replace(/\s/g, '').toUpperCase();
                    field.onChange(value);
                  }}
                  inputProps={{
                    maxLength: 8, // Longitud máxima para matrículas como "1234-ABC" (7 caracteres + posible guión)
                  }}
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Card>
  );
}
