'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { SignOut as SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';

import { paths } from '@/paths';
import { type User } from '@/types/user';

interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function UserPopover({ anchorEl, onClose, open, user, onSignOut }: UserPopoverProps): React.JSX.Element {
  const [isSigningOut, setIsSigningOut] = React.useState<boolean>(false);

  const handleSignOut = async (): Promise<void> => {
    setIsSigningOut(true);
    try {
      await onSignOut();
      onClose(); // Cierra el popover después de cerrar sesión
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: '240px' } } }}
    >
      <Box sx={{ p: '16px 20px ' }}>
        <Typography variant="subtitle1">{user?.nombre ?? 'Usuario no disponible'}</Typography>
        <Typography color="text.secondary" variant="body2">
          {user?.email ?? 'Email no disponible'}
        </Typography>
      </Box>
      <Divider />
      <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
        <MenuItem component={RouterLink} href={paths.dashboard.profile} onClick={onClose}>
          <ListItemIcon>
            <UserIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Perfil
        </MenuItem>
        <MenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <ListItemIcon>
            <SignOutIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          {isSigningOut ? 'Saliendo...' : 'Cerrar sesión'}
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
