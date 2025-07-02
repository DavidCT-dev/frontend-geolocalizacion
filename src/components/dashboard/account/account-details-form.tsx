'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Unstable_Grid2';
import { Typography } from '@mui/material';
import { useUser } from '@/hooks/use-user';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { profileSchema } from '../../../schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type FormData = z.infer<typeof profileSchema>;

export function AccountDetailsForm({ user }: any): React.JSX.Element {
  const { checkSession, rolUser } = useUser();
  const isDriver = /conductor/i.test(rolUser?.toString() || '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: user?.nombre || '',
      ci: user?.ci || '',
      telefono: user?.telefono || '',
      email: user?.email || '',
      vehiculo: user?.vehiculo || '',
      matricula: user?.matricula || ''
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/${user?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar');
      }

      await checkSession?.();
      alert('Perfil actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar:', err);
      alert(err instanceof Error ? err.message : 'Error al actualizar el perfil');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader subheader="La información se puede editar" title="Perfil" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid md={6} xs={12}>
              <FormControl fullWidth error={!!errors.nombre}>
                <InputLabel>Nombre</InputLabel>
                <OutlinedInput
                  {...register('nombre')}
                  label="Nombre"
                />
                {errors.nombre && (
                  <Typography variant="caption" color="error">
                    {errors.nombre.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid md={6} xs={12}>
              <FormControl fullWidth error={!!errors.ci}>
                <InputLabel>CI</InputLabel>
                <OutlinedInput
                  {...register('ci')}
                  label="CI"
                />
                {errors.ci && (
                  <Typography variant="caption" color="error">
                    {errors.ci.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid md={6} xs={12}>
              <FormControl fullWidth error={!!errors.telefono}>
                <InputLabel>Teléfono</InputLabel>
                <OutlinedInput
                  {...register('telefono')}
                  label="Teléfono"
                />
                {errors.telefono && (
                  <Typography variant="caption" color="error">
                    {errors.telefono.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid md={6} xs={12}>
              <FormControl fullWidth error={!!errors.email}>
                <InputLabel>Correo</InputLabel>
                <OutlinedInput
                  {...register('email')}
                  label="Correo"
                  type="email"
                />
                {errors.email && (
                  <Typography variant="caption" color="error">
                    {errors.email.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {isDriver && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Información del Vehículo
                  </Typography>
                  <Divider />
                </Grid>

                <Grid xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.vehiculo}>
                    <InputLabel>Tipo de Vehículo</InputLabel>
                    <Select
                      value={watch('vehiculo')}
                      onChange={(e) => setValue('vehiculo', e.target.value)}
                      label="Tipo de Vehículo"
                    >
                      <MenuItem value="Minibús">Minibús</MenuItem>
                      <MenuItem value="Microbús">Microbús</MenuItem>
                    </Select>
                    {errors.vehiculo && (
                      <Typography variant="caption" color="error">
                        {errors.vehiculo.message}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.matricula}>
                    <InputLabel>Matrícula</InputLabel>
                    <OutlinedInput
                      {...register('matricula')}
                      label="Matrícula"
                    />
                    {errors.matricula && (
                      <Typography variant="caption" color="error">
                        {errors.matricula.message}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Actualizando...' : 'Actualizar Información'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}
