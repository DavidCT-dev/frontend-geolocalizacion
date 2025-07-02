import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPie as ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { PlugsConnected as PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';
// Nuevos iconos importados
import { Notebook as NotebookIcon } from '@phosphor-icons/react/dist/ssr/Notebook'; // Icono de registro
import { Bus as BusIcon } from '@phosphor-icons/react/dist/ssr/Bus'; // Icono de bus/conductor
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin'; // Icono de ubicación
import { PlusCircle as PlusCircleIcon } from '@phosphor-icons/react/dist/ssr/PlusCircle';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'; // Para Jornada
import { ClipboardText as ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr/ClipboardText'; // Para Registros

export const navIcons = {
  'chart-pie': ChartPieIcon,
  'gear-six': GearSixIcon,
  'plugs-connected': PlugsConnectedIcon,
  'x-square': XSquare,
  user: UserIcon,
  users: UsersIcon,
  // Nuevos iconos agregados
  'notebook': NotebookIcon,       // Icono de registro
  'bus': BusIcon,                // Icono de bus/conductores
  'map-pin': MapPinIcon,          // Icono de ubicación
  'plus-circle': PlusCircleIcon,    // Para Crear Asignación
  'list': ListIcon,                // Para Ver Asignaciones
  'clock': ClockIcon,              // Para Jornada
  'clipboard-text': ClipboardTextIcon
} as Record<string, Icon>;
