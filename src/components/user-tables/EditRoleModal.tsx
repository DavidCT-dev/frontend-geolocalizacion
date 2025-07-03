'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';

interface Permission {
  _id: string;
  nombre: string;
}

interface Role {
  _id: string;
  nombre: string;
  permisoIds: Permission[];
}

interface EditRoleModalProps {
  open: boolean;
  onClose: () => void;
  // role: Role | null;
  roles: Role[]; // Lista completa de roles
  permissions: Permission[];
  onUpdateRole: (id: string, nombre: string, permisoIds: string[]) => Promise<void>;
}

export function EditRoleModal({
  open,
  onClose,
  // role,
  roles,
  permissions,
  onUpdateRole,
}: EditRoleModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  // Actualiza los campos según el rol seleccionado
  useEffect(() => {
    const rol = roles.find((r) => r._id === selectedRoleId);
    if (rol) {
      setRoleName(rol.nombre);
      setSelectedPermisos(rol.permisoIds?.map((p) => p._id) || []);
    } else {
      setRoleName('');
      setSelectedPermisos([]);
    }
  }, [selectedRoleId, roles]);

  const togglePermiso = (id: string) => {
    setSelectedPermisos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedRoleId || !roleName.trim()) return;

    setLoading(true);
    try {
      await onUpdateRole(selectedRoleId, roleName, selectedPermisos);
      setSnackbar({
        open: true,
        message: 'Rol actualizado correctamente',
        severity: 'success',
      });
      onClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al actualizar el rol',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const basicPermissions = permissions.filter((p) => !p.nombre.includes('-'));
  const actionPermissions = permissions.filter((p) => p.nombre.includes('-'));

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Actualizar Rol
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="role-select-label">Seleccionar Rol</InputLabel>
            <Select
              labelId="role-select-label"
              value={selectedRoleId}
              onChange={(e) => { setSelectedRoleId(e.target.value); }}
              label="Seleccionar Rol"
              disabled={loading}
            >
              {roles.map((r) => (
                <MenuItem key={r._id} value={r._id}>
                  {r.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Nombre del rol"
            value={roleName}
            onChange={(e) => { setRoleName(e.target.value); }}
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            Permisos asignados
          </Typography>

          <Box display="flex" gap={4}>
            <Box flex={1}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Menú Principal
              </Typography>
              <FormGroup sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
                {basicPermissions.map((p) => (
                  <FormControlLabel
                    key={p._id}
                    control={
                      <Checkbox
                        checked={selectedPermisos.includes(p._id)}
                        onChange={() => { togglePermiso(p._id); }}
                        disabled={loading}
                      />
                    }
                    label={p.nombre}
                  />
                ))}
              </FormGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box flex={1}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Acciones
              </Typography>
              <FormGroup sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
                {actionPermissions.map((p) => (
                  <FormControlLabel
                    key={p._id}
                    control={
                      <Checkbox
                        checked={selectedPermisos.includes(p._id)}
                        onChange={() => { togglePermiso(p._id); }}
                        disabled={loading}
                      />
                    }
                    label={p.nombre}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="secondary" disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !roleName.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Actualizando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
