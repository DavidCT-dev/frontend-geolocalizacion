'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { setToken } from '@/lib/auth/client';

// Esquema de validación
const schema = zod.object({
  password: zod.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
  confirmPassword: zod.string().min(8, { message: 'Debes confirmar tu contraseña' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type Values = zod.infer<typeof schema>;

const defaultValues = { password: '', confirmPassword: '' } satisfies Values;

export function SendPasswordForm(): React.JSX.Element {
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const { checkSession } = useUser();

  const handleClickShowPassword = () => { setShowPassword((show) => !show); };
  const handleClickShowConfirmPassword = () => { setShowConfirmPassword((show) => !show); };


  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      try {
        // Obtener token de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
          setError('root', { message: 'Token no encontrado en la URL' });
          console.log()
          return;
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/confirm-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            password: values.password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al restablecer la contraseña');
        }

        const data = await response.json();
        console.log(data)
        setToken(token)
        await checkSession?.();

        // UserProvider, for this case, will not refresh the router
        // After refresh, GuestGuard will handle the redirect
        router.refresh();

      } catch (err) {
        setError('root', { message: err instanceof Error ? err.message : 'Ocurrió un error desconocido' });
      } finally {
        setIsPending(false);
      }
    },
    [setError]
  );

  return (
    <Stack spacing={4}>
      <Typography variant="h5">Establecer contraseña</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          {/* Campo de contraseña */}
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel>Nueva contraseña</InputLabel>
                <OutlinedInput
                  {...field}
                  type={showPassword ? 'text' : 'password'}
                  label="Nueva contraseña"
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          {/* Campo de confirmación de contraseña */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormControl error={Boolean(errors.confirmPassword)}>
                <InputLabel>Confirmar contraseña</InputLabel>
                <OutlinedInput
                  {...field}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirmar contraseña"
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleClickShowConfirmPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {errors.confirmPassword ? (
                  <FormHelperText>{errors.confirmPassword.message}</FormHelperText>
                ) : null}
              </FormControl>
            )}
          />

          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          <Button disabled={isPending} type="submit" variant="contained">
            Guardar nueva contraseña
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
