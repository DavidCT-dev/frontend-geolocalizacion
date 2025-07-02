'use client';

import React, { useState } from "react";
import { Avatar, Box, Card, CardContent, CardHeader, Stack, Typography, Button, CardActions, Divider } from "@mui/material";
import { useUser } from "@/hooks/use-user";
import { logger } from "@/lib/default-logger";
import Grid from '@mui/material/Unstable_Grid2';
import { AccountDetailsForm } from "@/components/dashboard/account/account-details-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import styles from "./../../../styles/pages/profile.module.css";



export default function ProfilePage(): React.JSX.Element {
  const { user, checkSession } = useUser();
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Función para obtener las iniciales del nombre
  const getInitials = (name?: string): string => {
    if (!name) return '';
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo y tamaño de imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('La imagen no debe exceder los 2MB');
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setLocalAvatar(base64Image); // Guarda la imagen en base64 localmente
      };

      reader.onerror = () => {
        throw new Error('Error al leer el archivo');
      };

      reader.readAsDataURL(file);
    } catch (err) {
      logger.error('Error al procesar la imagen:', err);
      alert('Ocurrió un error al procesar la imagen');
    } finally {
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // Preparar datos actualizados
      const updatedUser = {
        ...user,
        avatar: localAvatar || user.avatar
      };

      // Enviar datos a la API
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

       if (!res.ok) {
        return  alert('Error al actualizar')
      }

      await checkSession?.();
      setLocalAvatar(null);
      alert('Perfil actualizado correctamente');
    } catch (err) {
      logger.error('Error al actualizar el perfil:', err);
      alert('Ocurrió un error al actualizar el perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  // Determinar qué avatar mostrar (local o del usuario)
  const displayedAvatar = localAvatar || user?.avatar;

  return (
    <div className={styles.profile_form_container}>
      <Card>
        <div className={styles.update}>
          <Box component="main" sx={{ p: 3 }}>
            <Grid container spacing={4}>
              <Grid xs={12}>
                <Typography variant="h4">Datos</Typography>
              </Grid>

              <Grid xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    boxShadow: 3,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <CardContent>
                    <Stack spacing={2} alignItems="center">
                      <Avatar
                        src={displayedAvatar}
                        sx={{
                          width: 96,
                          height: 96,
                          boxShadow: 2,
                          bgcolor: displayedAvatar ? undefined : 'primary.main'
                        }}
                      >
                        {displayedAvatar ? null : getInitials(user?.nombre)}
                      </Avatar>
                      <Stack spacing={0.5} alignItems="center">
                        <Typography variant="h6" fontWeight={600}>
                          {user?.nombre ?? 'Usuario'}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {user?.email ?? ''}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>

                  <Divider sx={{ my: 1 }} />

                  <CardActions sx={{ justifyContent: 'center', gap: 2 }}>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleButtonClick}
                      disabled={!user}
                    >
                      Cambiar foto
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleUpdateProfile}
                      disabled={!localAvatar || isUpdating}
                    >
                      {isUpdating ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid xs={12} md={6} lg={8}>
                <AccountDetailsForm
                  user={user}
                />
              </Grid>
            </Grid>
          </Box>
        </div>
      </Card>

      <Card>
        <div className={styles.profile_data_container}>
          <Grid sx={{ p: 3 }}  >
                <Typography variant="h4">Cambiar contraseña</Typography>
          </Grid>
        </div>
        <div className={styles.update}>
          <ChangePasswordForm user={user} />
        </div>
      </Card>
    </div>
  );
}
