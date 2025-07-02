export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', sendPassword: '/auth/send-password' },
  dashboard: {
    overview: '/dashboard',
    profile: '/dashboard/profile',
    users: '/dashboard/users',
    drivers: '/dashboard/drivers',
    routes: '/dashboard/routes',
    assignments: '/dashboard/assignments',
    listAssignments: '/dashboard/assignments/listAssignments',
    jornada: '/dashboard/jornada',
    registro: '/dashboard/registro',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
