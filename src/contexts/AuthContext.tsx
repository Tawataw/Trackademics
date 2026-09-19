import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, loginWithGoogle, logoutFirebase } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { dbApi } from '../lib/db';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTrackerStore } from '../store/useTrackerStore';
import { GroupType } from '../types';
import { normalizeClass } from '../utils/formatters';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

export interface DbUser {
  name: string;
  class: string;
  group: string;
  collegeName?: string;
  uid?: string;
  email?: string;
  createdAt?: number;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  needsOnboarding: boolean;
  signInWithGoogle: () => Promise<boolean>;
  studentLogin: (data: DbUser) => Promise<boolean>;
  logOut: () => Promise<void>;
  deleteAccountAndData: () => Promise<void>;
  isAdmin: boolean;
  adminLogin: (password: string) => Promise<boolean>;
  token: string | null;
  updateDbUser: (data: Partial<DbUser>) => Promise<void>;
  completeOnboarding: (data: { name: string; class: string; group: string; collegeName: string }) => Promise<void>;
}

const checkOnboardingNeeded = (userProfile: { class?: string; group?: string; collegeName?: string } | null | undefined): boolean => {
  if (!userProfile) return true;
  const hasClass = Boolean(normalizeClass(userProfile.class));
  const hasGroup = Boolean(userProfile.group && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(userProfile.group.toUpperCase()));
  const hasCollege = Boolean(userProfile.collegeName && userProfile.collegeName.trim().length > 0);
  return !hasClass || !hasGroup || !hasCollege;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('auth_token', idToken);
          localStorage.setItem('current_uid', firebaseUser.uid);
          localStorage.removeItem('is_admin');

          const userCreatedAt = firebaseUser.metadata.creationTime
            ? new Date(firebaseUser.metadata.creationTime).getTime()
            : Date.now();

          // Sync data from Firestore WITHOUT setting hardcoded class or group defaults
          const syncedData = await dbApi.syncLocalDataToFirestore(firebaseUser.uid, {
            name: firebaseUser.displayName || 'Student',
            email: firebaseUser.email || '',
            createdAt: userCreatedAt
          });

          const studentProfile: DbUser = {
            name: syncedData?.name || firebaseUser.displayName || 'Student',
            class: syncedData?.class || '',
            group: syncedData?.group ? syncedData.group.toUpperCase() : '',
            collegeName: syncedData?.collegeName || '',
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            createdAt: syncedData?.createdAt || userCreatedAt
          };

          const isMissingProfile = checkOnboardingNeeded(studentProfile);
          setNeedsOnboarding(isMissingProfile);
          setDbUser(studentProfile);
          localStorage.setItem('student_user', JSON.stringify(studentProfile));

          // If group is valid, immediately synchronize tracker store
          if (studentProfile.group && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(studentProfile.group)) {
            useTrackerStore.getState().setGroup(studentProfile.group as GroupType);
          }

          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || studentProfile.name,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL
          });
          setIsAdmin(false);
        } catch (error) {
          console.error('Error synchronizing student profile on auth change:', error);
          // Fallback to local user
          const stored = localStorage.getItem('student_user');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setDbUser(parsed);
              setNeedsOnboarding(checkOnboardingNeeded(parsed));
              if (parsed?.group && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(parsed.group.toUpperCase())) {
                useTrackerStore.getState().setGroup(parsed.group.toUpperCase() as GroupType);
              }
            } catch (e) {}
          } else {
            setNeedsOnboarding(true);
          }
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL
          });
        }
      } else {
        // Not a Firebase user - check if admin is logged in
        const storedIsAdmin = localStorage.getItem('is_admin');
        const storedToken = localStorage.getItem('auth_token');

        if (storedIsAdmin === 'true' && storedToken) {
          setIsAdmin(true);
          setToken(storedToken);
          setUser({ uid: 'admin-user', displayName: 'Administrator', email: null });
          setDbUser({ name: 'Administrator', class: 'Admin', group: 'SCIENCE' });
          setNeedsOnboarding(false);
        } else {
          setUser(null);
          setDbUser(null);
          setToken(null);
          setIsAdmin(false);
          setNeedsOnboarding(false);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('is_admin');
          localStorage.removeItem('current_uid');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const completeOnboarding = async (data: { name: string; class: string; group: string; collegeName: string }) => {
    const formattedGroup = data.group.toUpperCase();
    const formattedCollege = data.collegeName.trim();
    const updatedProfile: DbUser = {
      ...(dbUser || { name: data.name, class: data.class, group: formattedGroup }),
      name: data.name,
      class: data.class,
      group: formattedGroup,
      collegeName: formattedCollege,
      uid: user?.uid,
      email: user?.email || dbUser?.email || ''
    };

    setDbUser(updatedProfile);
    localStorage.setItem('student_user', JSON.stringify(updatedProfile));
    setNeedsOnboarding(false);

    // Synchronize Zustand tracker store immediately
    if (['SCIENCE', 'ARTS', 'COMMERCE'].includes(formattedGroup)) {
      useTrackerStore.getState().setGroup(formattedGroup as GroupType);
    }

    if (user && !isAdmin && user.uid !== 'admin-user') {
      try {
        await dbApi.updateUserProfile(user.uid, {
          name: data.name,
          class: data.class,
          group: formattedGroup,
          collegeName: formattedCollege
        });
      } catch (e) {
        console.error('Failed to save onboarding to Firestore:', e);
      }
    }
  };

  const updateDbUser = async (data: Partial<DbUser>) => {
    const formattedGroup = data.group ? data.group.toUpperCase() : dbUser?.group;
    const updated: DbUser = {
      ...(dbUser || { name: 'Student', class: '', group: '' }),
      ...data,
      ...(formattedGroup ? { group: formattedGroup } : {})
    };

    setDbUser(updated);
    setNeedsOnboarding(checkOnboardingNeeded(updated));
    localStorage.setItem('student_user', JSON.stringify(updated));

    if (formattedGroup && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(formattedGroup)) {
      useTrackerStore.getState().setGroup(formattedGroup as GroupType);
    }

    if (user && !isAdmin && user.uid !== 'admin-user') {
      try {
        await dbApi.updateUserProfile(user.uid, {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.class !== undefined ? { class: data.class } : {}),
          ...(formattedGroup !== undefined ? { group: formattedGroup } : {}),
          ...(data.collegeName !== undefined ? { collegeName: data.collegeName } : {})
        });
      } catch (e) {
        console.error('Failed to update profile in Firestore:', e);
      }
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await loginWithGoogle();
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();
      
      setToken(idToken);
      localStorage.setItem('auth_token', idToken);
      localStorage.setItem('current_uid', firebaseUser.uid);
      localStorage.removeItem('is_admin');

      const userCreatedAt = firebaseUser.metadata.creationTime
        ? new Date(firebaseUser.metadata.creationTime).getTime()
        : Date.now();

      const synced = await dbApi.syncLocalDataToFirestore(firebaseUser.uid, {
        name: firebaseUser.displayName || 'Student',
        email: firebaseUser.email || '',
        createdAt: userCreatedAt
      });

      const profile: DbUser = {
        name: synced?.name || firebaseUser.displayName || 'Student',
        class: synced?.class || '',
        group: synced?.group ? synced.group.toUpperCase() : '',
        collegeName: synced?.collegeName || '',
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        createdAt: synced?.createdAt || userCreatedAt
      };

      const isMissingProfile = checkOnboardingNeeded(profile);
      setNeedsOnboarding(isMissingProfile);
      setDbUser(profile);
      localStorage.setItem('student_user', JSON.stringify(profile));

      if (profile.group && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(profile.group)) {
        useTrackerStore.getState().setGroup(profile.group as GroupType);
      }

      setUser({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || profile.name,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL
      });
      setIsAdmin(false);
      return true;
    } catch (error: any) {
      console.error('Google Sign In failed:', error);
      throw error;
    }
  };

  // Legacy student login fallback if needed
  const studentLogin = async (data: DbUser): Promise<boolean> => {
    const fakeToken = 'student-token-' + Date.now();
    localStorage.setItem('auth_token', fakeToken);
    localStorage.setItem('student_user', JSON.stringify(data));
    setToken(fakeToken);
    setUser({ uid: 'student-user', displayName: data.name, email: data.email || null });
    setDbUser(data);
    setIsAdmin(false);
    return true;
  };

  const adminLogin = async (password: string): Promise<boolean> => {
    if (password === 'hsc-hsc-2202') {
      const adminToken = 'admin-token-' + Date.now();
      setToken(adminToken);
      localStorage.setItem('auth_token', adminToken);
      localStorage.setItem('is_admin', 'true');
      localStorage.removeItem('current_uid');
      setIsAdmin(true);
      setUser({ uid: 'admin-user', displayName: 'Administrator', email: null });
      setDbUser({ name: 'Administrator', class: 'Admin', group: 'SCIENCE' });
      return true;
    }
    return false;
  };

  const logOut = async () => {
    if (isAdmin) {
      setIsAdmin(false);
      setToken(null);
      setUser(null);
      setDbUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('is_admin');
      localStorage.removeItem('student_user');
      localStorage.removeItem('current_uid');
    } else {
      try {
        await logoutFirebase();
      } catch (e) {
        console.error('Firebase signout error:', e);
      }
      setIsAdmin(false);
      setToken(null);
      setUser(null);
      setDbUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('is_admin');
      localStorage.removeItem('student_user');
      localStorage.removeItem('current_uid');
    }
  };

  const deleteAccountAndData = async () => {
    const targetUid = user?.uid || auth.currentUser?.uid;

    // 1. Immediately delete user document from Firestore users collection
    if (targetUid && targetUid !== 'admin-user' && targetUid !== 'student-user') {
      try {
        await dbApi.deleteUserAccountAndData(targetUid);
      } catch (err) {
        console.error('Failed to delete document from Firestore users collection:', err);
        throw err;
      }
    } else {
      await dbApi.deleteUserAccountAndData();
    }

    // 2. Clear all local storage records
    localStorage.removeItem('profileData');
    localStorage.removeItem('hsc-tracker-storage');
    localStorage.removeItem('student_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_uid');
    localStorage.removeItem('is_admin');

    // 3. Reset in-memory tracker state
    useTrackerStore.getState().setGroup('SCIENCE');

    // 4. Attempt to delete Firebase Auth user (graceful fallback if requires recent login)
    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
        console.log('Firebase Auth user deleted successfully');
      } catch (authErr: any) {
        console.warn('Firebase Auth user delete skipped or requires recent login, proceeding with signOut:', authErr);
      }
    }

    // 5. Sign out from Firebase
    try {
      await logoutFirebase();
    } catch (signOutErr) {
      console.warn('Sign out warning:', signOutErr);
    }

    // 6. Reset context states
    setUser(null);
    setDbUser(null);
    setToken(null);
    setIsAdmin(false);
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      dbUser,
      loading,
      needsOnboarding,
      signInWithGoogle,
      studentLogin,
      logOut,
      deleteAccountAndData,
      isAdmin,
      adminLogin,
      token,
      updateDbUser,
      completeOnboarding
    }}>
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
