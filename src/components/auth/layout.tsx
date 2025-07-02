import * as React from 'react';
import RouterLink from 'next/link';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
export interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <Box
      sx={{
        display: { xs: 'flex', lg: 'grid' },
        flexDirection: 'column',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '100%',
      }}
    >
      <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}>
        <Box sx={{ alignItems: 'center', display: 'flex', flex: '1 1 auto', justifyContent: 'center', p: 3 }}>
          <Box sx={{ maxWidth: '450px', width: '100%' }}>{children}</Box>
        </Box>
      </Box>
      <Box
        sx={{
          alignItems: 'center',
          background: 'radial-gradient(50% 50% at 50% 50%, #122647 0%, #090E23 100%)',
          color: 'var(--mui-palette-common-white)',
          display: { xs: 'none', lg: 'flex' },
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Box
              sx={{
                height: '100vh', // Ocupa toda la altura de la pantalla
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative', // Necesario para el posicionamiento absoluto de la marca de agua
                p: 4,
                overflow: 'hidden' // Evita scroll si la imagen es muy grande
              }}
            >
              {/* Marca de agua (fondo) */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: 0.2,
                  zIndex: 0,
                  width: { xs: '200px', md: '200px' }, // Responsive
                  height: { xs: '200px', md: '200px' }
                }}
              >
                <Image
                  src="/logo.png"
                  alt="Logo de fondo"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </Box>

              {/* Contenido de texto (superpuesto) */}
              <Stack
                spacing={1}
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  maxWidth: '800px',
                  textAlign: 'center'
                }}
              >
                <Typography color="inherit" sx={{ fontSize: '24px', lineHeight: '32px' }} variant="h1">
                  Bienvenido/a a{' '}
                  <Box component="span" sx={{ color: '#15b79e' }}>
                    12 de Mayo
                  </Box>
                </Typography>
                <Typography variant="subtitle1">
                  Sistema web y aplicación móvil de geolocalización en tiempo real y administración de rutas para la Cooperativa de transporte 12 de Mayo de la ciudad de Potosí
                </Typography>
              </Stack>
            </Box>
          </Stack>

        </Stack>
      </Box>
    </Box>
  );
}
