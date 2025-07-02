'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CaretUpDown as CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr/CaretUpDown';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import Image from 'next/image';
import { useUser } from '@/hooks/use-user';
import { navItems } from './config';
import { navIcons } from './nav-icons';

export interface MobileNavProps {
  onClose?: () => void;
  open?: boolean;
  items?: NavItemConfig[];
}

export function MobileNav({ open, onClose }: MobileNavProps): React.JSX.Element {
  const pathname = usePathname();
  const { permissions } = useUser();

  const filterItems = (items: NavItemConfig[]): NavItemConfig[] => {
    return items.filter(item => {
      const hasPermission = !item.requiredPermissions ||
        item.requiredPermissions.some(perm => permissions.includes(perm));

      if (item.children) {
        item.children = filterItems(item.children);
        return hasPermission && item.children.length > 0;
      }

      return hasPermission;
    });
  };

  const filteredItems = filterItems(navItems);

  return (
    <Drawer
      PaperProps={{
        sx: {
          '--MobileNav-background': '#030d17',
          '--MobileNav-color': 'var(--mui-palette-common-white)',
          '--NavItem-color': 'var(--mui-palette-neutral-300)',
          '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
          '--NavItem-active-background': '#4f4f4f',
          '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
          '--NavItem-disabled-color': 'var(--mui-palette-neutral-500)',
          '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
          '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
          '--NavItem-icon-disabled-color': 'var(--mui-palette-neutral-600)',
          bgcolor: 'var(--MobileNav-background)',
          color: 'var(--MobileNav-color)',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          scrollbarWidth: 'none',
          width: '250px',
          zIndex: 'var(--MobileNav-zIndex)',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      }}
      onClose={onClose}
      open={open}
    >
      <Stack spacing={1} sx={{ p: 2 }}>
        <Box
          component={RouterLink}
          href={paths.home}
          sx={{ display: 'block', mx: 'auto', width: 400 }}
          style={{textDecoration: 'none'}}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <Image
              src="/logo.png"
              alt="Logo de la app"
              width={55}
              height={55}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1', justifyContent: 'center'}}>
              <span style={{ fontSize: '18px' ,color:'#e3e4e5' }}>Cooperativa 12</span>
              <span style={{ fontSize: '18px' ,color:'#e3e4e5'}}>de Mayo</span>
            </div>
          </div>
        </Box>
      </Stack>

      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />

      <Box component="nav" sx={{ flex: '1 1 auto', p: '12px', overflowY: 'auto' }}>
        {renderNavItems({ pathname, items: filteredItems })}
      </Box>
    </Drawer>
  );
}

function renderNavItems({ items = [], pathname }: { items?: NavItemConfig[]; pathname: string }): React.JSX.Element {
  const children = items.reduce((acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
    const { key, ...item } = curr;
    acc.push(<NavItem key={key} pathname={pathname} {...item} />);
    return acc;
  }, []);
return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {children}
    </Stack>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'children'> {
  pathname: string;
  children?: NavItemConfig[];
}

function NavItem({ disabled, external, href, icon, matcher, pathname, title, children }: NavItemProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon ? navIcons[icon] : null;
  const hasChildren = Boolean(children?.length);

  const handleToggle = () => {
    if (hasChildren) setOpen(!open);
  };

  return (
    <li>
      <Box
        {...(href
          ? {
              component: external ? 'a' : RouterLink,
              href,
              target: external ? '_blank' : undefined,
              rel: external ? 'noreferrer' : undefined,
            }
          : { role: 'button', onClick: handleToggle })}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          flex: '0 0 auto',
          gap: 1,
          p: '6px 16px',
          position: 'relative',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          ...(disabled && {
            bgcolor: 'var(--NavItem-disabled-background)',
            color: 'var(--NavItem-disabled-color)',
          }),
          ...(active && {
            bgcolor: 'var(--NavItem-active-background)',
            color: 'var(--NavItem-active-color)',
          }),
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
          {Icon && (
            <Icon
              fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'}
              fontSize="var(--icon-fontSize-md)"
              weight={active ? 'fill' : undefined}
            />
          )}
        </Box>
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography
            component="span"
            sx={{ color: 'inherit', fontSize: '0.875rem', fontWeight: 500, lineHeight: '28px' }}
          >
            {title}
          </Typography>
        </Box>
        {hasChildren && (
          <CaretUpDownIcon
            fontSize="var(--icon-fontSize-sm)"
            style={{
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease-in-out'
            }}
          />
        )}
      </Box>

      {hasChildren && open && (
        <Stack
          component="ul"
          spacing={1}
          sx={{
            listStyle: 'none',
            pl: 3,
            pt: 1,
            borderLeft: '1px solid',
            borderColor: 'var(--mui-palette-neutral-700)'
          }}
        >
          {children?.map((child: any) => (
            <NavItem key={child.key} pathname={pathname} {...child} />
          ))}
        </Stack>
      )}
    </li>
  );
}
