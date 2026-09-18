import re

with open('src/contexts/AuthContext.tsx', 'r') as f:
    code = f.read()

code = code.replace(
    'signIn: () => Promise<void>;', 
    'signIn: () => Promise<User | null>;'
)

old_fn = """  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };"""

new_fn = """  const signIn = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return cred.user;
    } catch (error) {
      console.error("Error signing in", error);
      return null;
    }
  };"""

code = code.replace(old_fn, new_fn)

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(code)

