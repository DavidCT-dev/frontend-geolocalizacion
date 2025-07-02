'use client';
import React, { useState } from 'react';
import {
  Modal,
  Box,
  TextField,
  MenuItem,
  Stack,
  Button,
  Typography
} from '@mui/material';
import { userSchema } from '../../schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z as zod } from 'zod';

type FormValues = zod.infer<typeof userSchema>;


export function CreateUserModal({ open, onClose, roles, onCreateUser }: any) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nombre: '',
      email: '',
      ci: '',
      telefono: '',
      rol: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await onCreateUser(data);
      reset();
      onClose();
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
        <Typography variant="h6" mb={3}>Registro nuevo usuario</Typography>
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
                  {roles.map((roleItem:any) => (
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
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
}
