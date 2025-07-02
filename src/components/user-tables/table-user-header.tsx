'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Button, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { CreateRoleModal } from './CreateRoleModal';
import { EditRoleModal } from './EditRoleModal';
import { useUser } from '@/hooks/use-user';

interface TableHeaderProps {
  isDriver?: boolean;
  refreshData?: () => void;
  roles: any[];
  refreshRoles?: () => void;
}

export function TableUserHeader({ isDriver, refreshData, roles, refreshRoles }: TableHeaderProps) {
  const { permissions } = useUser();
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [openEditRoleModal, setOpenEditRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [permisos, setPermisos] = useState<{ _id: string; nombre: string }[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Obtener permisos del backend
  useEffect(() => {
    const fetchPermisos = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}permisos`);
        if (!res.ok) throw new Error('Error al obtener permisos');
        const data = await res.json();
        setPermisos(data);
      } catch (error) {
        console.error('Error cargando permisos:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar los permisos',
          severity: 'error',
        });
      }
    };
    fetchPermisos();
  }, []);

  const handleCreateRole = async (roleName: string, selectedPermisos: string[]) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: roleName, permisoIds: selectedPermisos }),
      });

      if (!res.ok) throw new Error('Error al crear rol');

      setSnackbar({
        open: true,
        message: 'Rol creado exitosamente',
        severity: 'success',
      });
      refreshRoles?.();
      setOpenRoleModal(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al crear el rol',
        severity: 'error',
      });
    }
  };

  const handleUpdateRole = async (id: string, nombre: string, permisoIds: string[]) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, permisoIds }),
      });

      if (!res.ok) throw new Error('Error al actualizar rol');

      setSnackbar({
        open: true,
        message: 'Rol actualizado exitosamente',
        severity: 'success',
      });
      refreshRoles?.();
      setOpenEditRoleModal(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al actualizar el rol',
        severity: 'error',
      });
      throw error; // Re-lanzar para que EditRoleModal lo maneje
    }
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setOpenEditRoleModal(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Card sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CardContent>
          <Typography variant="h2">Datos</Typography>
        </CardContent>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '3rem' }}>
          {permissions?.includes('crear-rol') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenRoleModal(true)}
            >
              Crear Rol
            </Button>
          )}

          {permissions?.includes('actualizar-rol') && roles.length > 0 && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<EditIcon />}
              onClick={() => handleEditRole(roles)}
            >
              Actualizar Rol
            </Button>
          )}
        </CardContent>
      </Card>

      <CreateRoleModal
        open={openRoleModal}
        onClose={() => setOpenRoleModal(false)}
        permissions={permisos}
        onCreateRole={handleCreateRole}
      />

      <EditRoleModal
        open={openEditRoleModal}
        onClose={() => setOpenEditRoleModal(false)}
        roles={roles}
        permissions={permisos}
        onUpdateRole={handleUpdateRole}
      />

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
