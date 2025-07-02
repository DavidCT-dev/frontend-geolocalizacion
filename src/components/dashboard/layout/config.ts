// config/nav-items.ts
import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  {
    key: 'profile',
    title: 'Perfil',
    href: paths.dashboard.profile,
    icon: 'user',  // ✔️ Ya existe en navIcons
    requiredPermissions: ['perfil']
  },
  {
    key: 'users',
    title: 'Usuarios',
    href: paths.dashboard.users,
    icon: 'users',  // ✔️ Ya existe en navIcons
    requiredPermissions: ['usuarios'],
  },
  {
    key: 'drivers',
    title: 'Conductores',
    href: paths.dashboard.drivers,
    icon: 'bus',  // Cambiado de 'steering-wheel' a 'bus' (que ya existe)
    requiredPermissions: ['conductor'],
  },
  {
    key: 'routes',
    title: 'Rutas y líneas',
    href: paths.dashboard.routes,
    icon: 'map-pin',  // ✔️ Ya existe en navIcons
    requiredPermissions: ['ruta'],
  },
  {
    key: 'assignments',
    title: 'Asignaciones',
    icon: 'notebook',  // Cambiado de 'calendar-check' a 'notebook' (que ya existe)
    requiredPermissions: ['asignacion'],
    children: [
      {
        key: 'create-assignment',
        title: 'Crear Asignación',
        href: paths.dashboard.assignments,
        icon: 'plus-circle', // Icono de creación/agregar
        requiredPermissions: ['crear-asignacion']
      },
      {
        key: 'view-assignments',
        title: 'Ver Asignaciones',
        href: paths.dashboard.listAssignments,
        icon: 'list', // Icono de listado/visualización
        requiredPermissions: ['asignacion']
      }
    ]
  },
  {
    key: 'workday',
    title: 'Jornada',
    href: paths.dashboard.jornada,
    icon: 'clock',  // Necesitarías importar este icono o usar uno existente
    requiredPermissions: ['jornada']
  },
  {
    key: 'records',
    title: 'Registros',
    href: paths.dashboard.registro,
    icon: 'notebook',  // Cambiado de 'clipboard-text' a 'notebook' (que ya existe)
    requiredPermissions: ['registro']
  },

] satisfies NavItemConfig[];
