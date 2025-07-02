// types/nav.ts
export interface NavItemConfig {
  key: string;
  title: string;
  href?: string;
  icon?: string;
  matcher?: { type: 'startsWith' | 'equals'; href: string };
  disabled?: boolean;
  external?: boolean;
  children?: NavItemConfig[];
  requiredPermissions?: string[]; // Añade esta propiedad
}
