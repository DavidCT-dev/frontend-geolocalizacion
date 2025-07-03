// src/schemas/profile-schemas.ts
import { z } from 'zod';

export const driverSchema = z.object({
  vehiculo: z.string().min(1, 'El tipo de vehículo es requerido'),
  matricula: z.string()
    .min(1, 'La matrícula es requerida')
    .regex(
      /^[A-Za-z0-9]{3,4}-[A-Za-z]{2,3}$|^[A-Za-z]{2,3}-[A-Za-z0-9]{3,4}$/,
      'La matrícula debe tener un formato válido (ej: 1234-ABC o ABC-123)'
    )
    .transform(val => val.toUpperCase()), // Convertir a mayúsculas
});


export const userSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'.-]+$/, 'Solo se permiten letras y caracteres especiales válidos'),
  email: z
    .string()
    .email('Correo electrónico inválido'),
  ci: z
    .string()
    .min(5, 'CI muy corto')
    .max(12, 'CI muy largo')
    .regex(/^[a-zA-Z0-9-]+$/, 'CI solo puede contener letras, números y guiones'),
  telefono: z
  .string()
  .optional()
  .refine(val => !val || /^\d{8}$/.test(val), {
    message: 'El número de teléfono debe tener exactamente 8 dígitos numéricos',
  }),
  rol: z.string().min(1, 'Seleccione un rol'),
});


// Esquema para datos de perfil
export const profileSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder los 50 caracteres'),
  ci: z.string()
    .min(6, 'La cédula debe tener al menos 6 caracteres')
    .max(12, 'La cédula no puede exceder los 12 caracteres'),
  telefono: z
  .string()
  .optional()
  .refine(val => !val || /^\d{8}$/.test(val), {
    message: 'El número de teléfono debe tener exactamente 8 dígitos numéricos',
  }),
  email: z.string()
    .email('Ingrese un email válido'),
  vehiculo: z.string().optional(),
  matricula: z.string().optional()
});

// Esquema para cambio de contraseña
export const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(6, 'La contraseña actual debe tener al menos 6 caracteres'),
  newPassword: z.string()
    .min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Esquema para validación de imágenes
export const imageSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 2 * 1024 * 1024, 'La imagen no debe exceder 2MB')
    .refine(file => file.type.startsWith('image/'), 'Debe ser un archivo de imagen válido')
});
