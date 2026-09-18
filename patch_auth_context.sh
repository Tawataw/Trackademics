cat << 'INNER_EOF' > src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export interface DbUser {
  name: string;
  class: string;
  group: string;
  uid?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  studentLogin: (data: DbUser) => Promise<boolean>;
  logOut: () => Promise<void>;
  isAdmin: boolean;
  adminLogin: (password: string) => Promise<boolean>;
  token: string | null;
  updateDbUser: (data: Partial<DbUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedIsAdmin = localStorage.getItem('is_admin');
      
      if (storedToken) {
        setToken(storedToken);
        if (storedIsAdmin === 'true') {
          setIsAdmin(true);
          setUser({ uid: 'admin-user', displayName: 'Administrator', email: null });
          setDbUser({ name: 'Administrator', class: 'Admin', group: 'SCIENCE' });
        } else {
          // Student login
          const storedUser = localStorage.getItem('student_user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser({ uid: 'student-user', displayName: parsedUser.name, email: null });
              setDbUser(parsedUser);
            } catch(e) {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('student_user');
            }
          } else {
             localStorage.removeItem('auth_token');
          }
        }
      }
      setLoading(false);
    };
    loadAuth();
  }, []);

  const updateDbUser = async (data: Partial<DbUser>) => {
    if (!token) return;
    try {
      setDbUser(prev => {
        const newData = prev ? { ...prev, ...data } : data as DbUser;
        localStorage.setItem('student_user', JSON.stringify(newData));
        return newData;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const studentLogin = async (data: DbUser) => {
    try {
      const fakeToken = 'student-token-' + Date.now();
      localStorage.setItem('auth_token', fakeToken);
      localStorage.setItem('student_user', JSON.stringify(data));
      setToken(fakeToken);
      setUser({ uid: 'student-user', displayName: data.name, email: null });
      setDbUser(data);
      setIsAdmin(false);
      return true;
    } catch (error) {
      console.error("Student login failed", error);
      return false;
    }
  };

  const adminLogin = async (password: string) => {
    try {
      if (password === 'hsc-hsc-2202') {
        const fakeToken = 'admin-token-' + Date.now();
        setToken(fakeToken);
        localStorage.setItem('auth_token', fakeToken);
        localStorage.setItem('is_admin', 'true');
        setIsAdmin(true);
        setUser({ uid: 'admin-user', displayName: 'Administrator', email: null });
        setDbUser({ name: 'Administrator', class: 'Admin', group: 'SCIENCE' });
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logOut = async () => {
    setIsAdmin(false);
    setToken(null);
    setUser(null);
    setDbUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('student_user');
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, studentLogin, logOut, isAdmin, adminLogin, token, updateDbUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
INNER_EOF
