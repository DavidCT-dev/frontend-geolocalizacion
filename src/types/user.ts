export interface User {
  id: string;
  nombre: string;
  avatar?: string;
  email: string;
  password?: string;
  telefono?: string;
  rol?: {  // Singular
    _id: string;
    nombre: string;
    permisoIds: Permiso[] | string[];
  };
  [key: string]: unknown;
}

// En tus tipos de usuario (types/user.ts)
export interface Permiso {
  _id: string;
  nombre: string;
}


