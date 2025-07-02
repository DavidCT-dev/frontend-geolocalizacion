'use client';
import React, { useEffect, useState } from 'react';
import {
  Modal, Box, TextField, MenuItem, Stack, Button,
  Typography
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z as zod } from 'zod';

const schema = zod.object({
  nombre: zod.string().min(1, 'Nombre es requerido'),
  email: zod.string().email('Email inválido'),
  ci: zod.string().min(1, 'CI es requerido'),
  telefono: zod.string(),
  rol: zod.string().min(1, 'Rol es requerido'),
});

type FormValues = zod.infer<typeof schema>;

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: any | null;
  roles: any[];
  refreshData?: () => void;
  showSnackbar: (message: string, severity: 'success' | 'error') => void;
}

export default function EditUserModal({
  open,
  onClose,
  user,
  roles,
  refreshData,
  showSnackbar
}: EditUserModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      email: '',
      ci: '',
      telefono: '',
      rol: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        nombre: user.nombre || '',
        email: user.email || '',
        ci: user.ci || '',
        telefono: user.telefono || '',
        rol: user.rol?._id || user.rol || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }

      showSnackbar('Usuario actualizado correctamente', 'success');
      refreshData?.();
      onClose();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : 'Error al actualizar usuario',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
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
        <Typography variant="h6" mb={3}>Editar usuario</Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Controller
              name="nombre"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Nombre"
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled
                />
              )}
            />
            <Controller
              name="ci"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="CI"
                  error={!!errors.ci}
                  helperText={errors.ci?.message}
                />
              )}
            />
            <Controller
              name="telefono"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Teléfono"
                  error={!!errors.telefono}
                  helperText={errors.telefono?.message}
                />
              )}
            />
            <Controller
              name="rol"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Rol"
                  error={!!errors.rol}
                  helperText={errors.rol?.message}
                >
                  {roles.map((roleItem) => (
                    <MenuItem key={roleItem._id} value={roleItem._id}>
                      {roleItem.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
}
