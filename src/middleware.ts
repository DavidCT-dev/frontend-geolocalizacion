// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // 1. Permitir todos los archivos estáticos y rutas de API
  const staticPaths = [
    '/_next/',
    '/favicon.ico',
    '/images/',
    '/assets/',
    '/api/',
    '/fonts/',
    '/scripts/',
    '/public/'
  ]

  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 2. Rutas públicas accesibles sin autenticación
  const publicPaths = [
    '/auth/send-password?token',
    '/auth/sign-in',
    '/auth/sign-up',
    '/unauthorized',
    '/password-reset'
  ]

  if (publicPaths.some(path => pathname === path)) {
    return NextResponse.next()
  }

  // 3. Redirigir si no está autenticado
  if (!token) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }

  try {
    // 4. Verificar token y obtener permisos
    const decodeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}auth/decoded`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!decodeResponse.ok) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }

    const tokenDecoded = await decodeResponse.json()

    // 5. Obtener información del usuario
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/${tokenDecoded.payload.id}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }

    const user = await userResponse.json()
    const userPermissions = user.rol.permisoIds.map((permiso: { nombre: string }) => permiso.nombre)

    // 6. Mapeo de rutas protegidas
    const protectedRoutes: Record<string, string[]> = {
      '/dashboard/profile': ['perfil'],
      '/dashboard/users': ['usuarios'],
      '/dashboard/drivers': ['conductor'],
      '/dashboard/routes': ['ruta'],
      '/dashboard/assignments': ['asignacion'],
      '/dashboard/jornada': ['jornada'],
      '/dashboard/registro': ['registro']
    }

    // 7. Verificar permisos
    const routeKey = Object.keys(protectedRoutes).find(key => pathname.startsWith(key))
    if (routeKey) {
      const requiredPermissions = protectedRoutes[routeKey]
      const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm))

      if (!hasPermission) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }
}
