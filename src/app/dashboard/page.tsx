// src/app/dashboard/overview/page.tsx

import type { Metadata } from 'next';
// import { config } from '@/config';


import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';

// export const metadata: Metadata = {title: Bienvenido | Dashboard | ${config.site.name}};

export default function Page(): React.JSX.Element {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,

      }}
    >

      <div style={{ position: 'relative', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Imagen como marca de agua */}

        <div style={{
          position: 'absolute',
          top: 200,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.2, // Ajusta la transparencia
          zIndex: 0
        }}>
          <Image
            src="/logo.png"
            alt="Logo de fondo"
            width={500} // Tamaño aumentado
            height={500}
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Texto de bienvenida */}

      </div>
    </Box>
  );
}
