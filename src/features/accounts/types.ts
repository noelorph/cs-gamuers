export type Role = 'student' | 'faculty' | 'program_head' | 'administrator';
export type ApplicationStatus = 'pending' | 'needs_correction' | 'approved' | 'rejected';

export type Actor = {
  id: string;
  role: Role;
};

export type AccountInput = {
  role: 'student' | 'faculty';
  fullName: string;
  studentNumber: string | null;
  employeeNumber: string | null;
  email: string;
  password: string;
};
