const roleHomes = {
  student: '/student',
  faculty: '/faculty',
  program_head: '/program-head',
  administrator: '/admin',
} as const;

export const paths = {
  signIn: '/auth/sign-in',
  authStatus: '/auth/status',
  authEmail: '/auth/email',
  signOut: '/auth/sign-out',
  courses: '/faculty/courses',
  newCourse: '/faculty/courses/new',
  roleHome: (role: keyof typeof roleHomes) => roleHomes[role],
  courseDraft: (id: string) => `/faculty/courses/${encodeURIComponent(id)}`,
};
