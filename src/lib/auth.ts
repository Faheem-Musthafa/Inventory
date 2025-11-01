import type { User } from './firebase';

// Validate user credentials and return user info
export const validateCredentials = (email: string, password: string): User | null => {
  // Check Manager credentials
  const managerEmail = import.meta.env.VITE_MANAGER_EMAIL;
  const managerPassword = import.meta.env.VITE_MANAGER_PASSWORD;

  if (email === managerEmail && password === managerPassword) {
    return {
      email,
      role: 'manager',
      name: 'Manager',
    };
  }

  // Check Staff credentials
  const staffEmails = import.meta.env.VITE_STAFF_EMAILS?.split(',') || [];
  const staffPasswords = import.meta.env.VITE_STAFF_PASSWORDS?.split(',') || [];

  const staffIndex = staffEmails.findIndex((e: string) => e.trim() === email);
  
  if (staffIndex !== -1 && staffPasswords[staffIndex]?.trim() === password) {
    return {
      email,
      role: 'staff',
      name: `Staff ${staffIndex + 1}`,
    };
  }

  return null;
};

// Check if user has manager role
export const isManager = (user: User | null): boolean => {
  return user?.role === 'manager';
};

// Check if user has staff role
export const isStaff = (user: User | null): boolean => {
  return user?.role === 'staff';
};

// Get current user from localStorage
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

// Save user to localStorage
export const saveCurrentUser = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('isAuthenticated', 'true');
};

// Clear user from localStorage
export const clearCurrentUser = (): void => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userEmail');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isAuthenticated') === 'true' && getCurrentUser() !== null;
};
