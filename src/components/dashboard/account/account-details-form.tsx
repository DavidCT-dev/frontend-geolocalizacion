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
import { Typography, Snackbar, Alert } from '@mui/material';
import { useUser } from '@/hooks/use-user';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { profileSchema } from '../../../schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { driverSchema } from '../../../schemas';
import { useEffect } from 'react';

// Combined schema types
type FormData = z.infer<typeof profileSchema> & Partial<z.infer<typeof driverSchema>>;

export function AccountDetailsForm({ user }: { user: any }): React.JSX.Element {
  const { checkSession, rolUser } = useUser();
  const isDriver = /conductor/i.test(rolUser?.toString() || '');

  // Estado para el Snackbar
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(
      profileSchema.merge(
        isDriver
          ? driverSchema.extend({
              vehiculo: z.enum(['MiniBus', 'MicroBus'], {
                required_error: 'Seleccione un tipo de vehículo',
                invalid_type_error: 'Tipo de vehículo no válido'
              })
            })
          : z.object({})
      )
    ),
    defaultValues: {
      nombre: '',
      ci: '',
      telefono: '',
      email: '',
      ...(isDriver && { vehiculo: '', matricula: '' })
    }
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      const defaultValues = {
        nombre: user.nombre || '',
        ci: user.ci || '',
        telefono: user.telefono || '',
        email: user.email || '',
        ...(isDriver && {
          vehiculo: user.vehiculo || '',
          matricula: user.matricula || ''
        })
      };
      reset(defaultValues);
    }
  }, [user, reset, isDriver]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        nombre: data.nombre,
        ci: data.ci,
        telefono: data.telefono,
        email: data.email,
        ...(isDriver && {
          vehiculo: data.vehiculo,
          matricula: data.matricula
        })
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/${user?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar');
      }

      await checkSession?.();

      // Mostrar Snackbar de éxito
      setSnackbar({
        open: true,
        message: 'Perfil actualizado correctamente',
        severity: 'success'
      });

    } catch (err) {
      console.error('Error al actualizar:', err);

      // Mostrar Snackbar de error
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al actualizar el perfil',
        severity: 'error'
      });
    }
  };

  // Observar valores para controlar los labels
  const values = watch();

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader subheader="La información se puede editar" title="Perfil" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              {/* Personal Information Fields */}
              <Grid md={6} xs={12}>
                <FormControl fullWidth error={Boolean(errors.nombre)}>
                  <InputLabel shrink={Boolean(values.nombre)}>Nombre</InputLabel>
                  <OutlinedInput
                    {...register('nombre')}
                    label="Nombre"
                    notched={Boolean(values.nombre)}
                  />
                  {errors.nombre && (
                    <Typography variant="caption" color="error">
                      {errors.nombre.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid md={6} xs={12}>
                <FormControl fullWidth error={Boolean(errors.ci)}>
                  <InputLabel shrink={Boolean(values.ci)}>CI</InputLabel>
                  <OutlinedInput
                    {...register('ci')}
                    label="CI"
                    notched={Boolean(values.ci)}
                  />
                  {errors.ci && (
                    <Typography variant="caption" color="error">
                      {errors.ci.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid md={6} xs={12}>
                <FormControl fullWidth error={Boolean(errors.telefono)}>
                  <InputLabel shrink={Boolean(values.telefono)}>Teléfono</InputLabel>
                  <OutlinedInput
                    {...register('telefono')}
                    label="Teléfono"
                    notched={Boolean(values.telefono)}
                  />
                  {errors.telefono && (
                    <Typography variant="caption" color="error">
                      {errors.telefono.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid md={6} xs={12}>
                <FormControl fullWidth error={Boolean(errors.email)}>
                  <InputLabel shrink={Boolean(values.email)}>Correo</InputLabel>
                  <OutlinedInput
                    {...register('email')}
                    label="Correo"
                    type="email"
                    notched={Boolean(values.email)}
                  />
                  {errors.email && (
                    <Typography variant="caption" color="error">
                      {errors.email.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Vehicle Information Section - Solo para conductores */}
              {isDriver && (
                <>
                  <Grid xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Información del Vehículo
                    </Typography>
                    <Divider />
                  </Grid>

                  <Grid xs={12} md={6}>
                    <FormControl fullWidth error={Boolean(errors.vehiculo)}>
                      <InputLabel shrink={Boolean(values.vehiculo)}>
                        Tipo de Vehículo
                      </InputLabel>
                      <Controller
                        name="vehiculo"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label="Tipo de Vehículo"
                            value={field.value || ''}
                            displayEmpty
                            inputProps={{
                              id: 'vehiculo-select',
                            }}
                            notched={Boolean(values.vehiculo)}
                          >
                            <MenuItem value="" disabled>
                              Seleccione un tipo
                            </MenuItem>
                            <MenuItem value="MiniBus">MiniBus</MenuItem>
                            <MenuItem value="MicroBus">MicroBus</MenuItem>
                          </Select>
                        )}
                      />
                      {errors.vehiculo && (
                        <Typography variant="caption" color="error">
                          {errors.vehiculo.message}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <FormControl fullWidth error={Boolean(errors.matricula)}>
                      <InputLabel shrink={Boolean(values.matricula)}>Matrícula</InputLabel>
                      <OutlinedInput
                        {...register('matricula')}
                        label="Matrícula"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '').toUpperCase();
                          e.target.value = value;
                        }}
                        inputProps={{
                          maxLength: 8,
                        }}
                        notched={Boolean(values.matricula)}
                      />
                      {errors.matricula && (
                        <Typography variant="caption" color="error">
                          {errors.matricula.message}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                </>
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

      {/* Snackbar para mostrar mensajes */}
      <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={() => { setSnackbar(prev => ({ ...prev, open: false })); }}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert severity={snackbar.severity} onClose={() => { setSnackbar(prev => ({ ...prev, open: false })); }}>
                {snackbar.message}
              </Alert>
            </Snackbar>
    </>
  );
}
