'use client';
import React from 'react';
import {
  Box, Card, Divider, Table, TableBody,
  TableCell, TableHead, TablePagination, TextField,
  InputAdornment, IconButton, Snackbar, Alert, Tooltip, Button,
  TableRow
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import { useSelection } from '@/hooks/use-selection';
import UserTableRow from './UserTableRow';
import DeleteUserDialog from './DeleteUserDialog';
import {CreateUserModal} from './CreateUserModal';
import EditUserModal from './EditUserModal';
import { useUser } from "@/hooks/use-user";

interface UserTableProps {
  count?: number;
  page?: number;
  headerTable: string[];
  rows?: any[];
  rowsPerPage?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
  onSearch?: (searchTerm: string) => void;
  onDeleteSuccess?: () => void;
  refreshData?: () => void;
  roles: any[];
}

export default function UserTable({
  count = 0,
  rows = [],
  page = 0,
  headerTable,
  rowsPerPage = 0,
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
  onSearch,
  onDeleteSuccess,
  refreshData,
  roles,
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredRows, setFilteredRows] = React.useState<(any)[]>(rows);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any| null>(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const { permissions } = useUser();

  const rowIds = React.useMemo(() => rows.map((user) => user.id), [rows]);
  const { selected } = useSelection(rowIds);

  React.useEffect(() => {
    if (!onSearch) {
      const filtered = rows.filter(row =>
        Object.values(row).some(
          value => value?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRows(filtered);
    }
  }, [searchTerm, rows, onSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch?.('');
  };

  const handleEdit = (user: any) => {
    setCurrentUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleCreateUser = async (userData: any) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData?.message || 'Error al crear usuario');
    }

    // Opcional: muestra mensaje y refresca lista
    setSnackbar({
      open: true,
      message: 'Usuario creado exitosamente',
      severity: 'success',
    });
    refreshData?.(); // Refrescar la tabla o lista de usuarios si existe
  } catch (error) {
    console.error('Error creando usuario:', error);
    setSnackbar({
      open: true,
      message: error instanceof Error ? error.message : 'Error desconocido',
      severity: 'error',
    });
  }
};

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/${userToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        showSnackbar('Usuario eliminado correctamente', 'success');
        refreshData?.();
        onDeleteSuccess?.();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : 'Error al eliminar usuario', 'error');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const displayRows = onSearch ? rows : filteredRows;

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
        {permissions?.includes('crear-usuario') ? <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setCreateModalOpen(true); }}
          >
            Nuevo Usuario
          </Button> : null}
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
            {displayRows.map((row) => (
              <UserTableRow
                key={row.id}
                row={row}
                isSelected={selected?.has(row.id)}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                permissions={permissions}
              />
            ))}
          </TableBody>
        </Table>
      </Box>

      <Divider />

      <TablePagination
        component="div"
        count={onSearch ? count : displayRows.length}
        onPageChange={(_, newPage) => { onPageChange(newPage); }}
        onRowsPerPageChange={(e) => { onRowsPerPageChange(parseInt(e.target.value, 10)); }}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); }}
        onConfirm={handleDeleteConfirm}
      />

      <CreateUserModal
        open={createModalOpen}
        onClose={() => { setCreateModalOpen(false); }}
        roles={roles}
        refreshData={refreshData}
        showSnackbar={showSnackbar}
        onCreateUser={handleCreateUser}
      />

      <EditUserModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); }}
        user={currentUser}
        roles={roles}
        refreshData={refreshData}
        showSnackbar={showSnackbar}
      />

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
    </Card>
  );
}
