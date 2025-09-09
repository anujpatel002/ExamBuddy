export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  token: string;
  isVerified: boolean; // <-- ADD THIS LINE
  subscription: {
    plan: string;
    status: string;
  };
}