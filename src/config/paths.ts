const roleHomes = {
  student: '/student',
  faculty: '/faculty',
  program_head: '/program-head',
  administrator: '/admin',
} as const;

export const paths = {
  signIn: '/auth/sign-in',
  adminSignIn: '/admin/sign-in',
  login: (role: keyof typeof roleHomes) =>
    role === 'administrator' ? ('/admin/sign-in' as const) : ('/auth/sign-in' as const),
  authStatus: '/auth/status',
  authEmail: '/auth/email',
  verifyEmail: '/auth/verify-email',
  studentSignUp: '/auth/sign-up/student',
  facultySignUp: '/auth/sign-up/faculty',
  signOut: '/auth/sign-out',
  courses: '/faculty/courses',
  applications: (role: 'faculty' | 'administrator') =>
    role === 'faculty' ? '/faculty/applications' : '/admin/applications',
  newCourse: '/faculty/courses/new',
  roleHome: (role: keyof typeof roleHomes) => roleHomes[role],
  courseDraft: (id: string) => `/faculty/courses/${encodeURIComponent(id)}`,
};
