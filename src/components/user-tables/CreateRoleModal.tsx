'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';

interface Permission {
  _id: string;
  nombre: string;
}

interface CreateRoleModalProps {
  open: boolean;
  onClose: () => void;
  permissions: Permission[];
  onCreateRole: (roleName: string, selectedPermisos: string[]) => Promise<void>;
}

export function CreateRoleModal({
  open,
  onClose,
  permissions,
  onCreateRole
}: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState('');
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const basicPermissions = permissions.filter(p => !p.nombre.includes('-'));
  const actionPermissions = permissions.filter(p => p.nombre.includes('-'));

  const togglePermiso = (id: string) => {
    setSelectedPermisos((prev) =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!roleName.trim()) return;

    setLoading(true);
    try {
      await onCreateRole(roleName, selectedPermisos);
      setSnackbar({
        open: true,
        message: 'Rol creado correctamente',
        severity: 'success',
      });
      setRoleName('');
      setSelectedPermisos([]);
      onClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al crear el rol',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Crear nuevo rol
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <TextField
            fullWidth
            label="Nombre del rol"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            Seleccione los permisos
          </Typography>

          <Box display="flex" gap={4}>
            {/* Permisos básicos */}
            <Box flex={1}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Menú Principal
              </Typography>
              <FormGroup sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
                {basicPermissions.map(p => (
                  <FormControlLabel
                    key={p._id}
                    control={
                      <Checkbox
                        checked={selectedPermisos.includes(p._id)}
                        onChange={() => togglePermiso(p._id)}
                        disabled={loading}
                      />
                    }
                    label={p.nombre}
                  />
                ))}
              </FormGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Permisos de acciones */}
            <Box flex={1}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Acciones
              </Typography>
              <FormGroup sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
                {actionPermissions.map(p => (
                  <FormControlLabel
                    key={p._id}
                    control={
                      <Checkbox
                        checked={selectedPermisos.includes(p._id)}
                        onChange={() => togglePermiso(p._id)}
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
            {loading ? 'Creando...' : 'Crear Rol'}
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
