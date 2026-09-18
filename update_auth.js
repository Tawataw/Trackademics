const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8');
code = code.replace(
  'signIn: () => Promise<void>;', 
  'signIn: () => Promise<User | null>;'
);
code = code.replace(
  '  const signIn = async () => {\n    try {\n      await signInWithPopup(auth, googleProvider);\n    } catch (error) {\n      console.error("Error signing in", error);\n    }\n  };',
  '  const signIn = async () => {\n    try {\n      const cred = await signInWithPopup(auth, googleProvider);\n      return cred.user;\n    } catch (error) {\n      console.error("Error signing in", error);\n      return null;\n    }\n  };'
);
fs.writeFileSync('src/contexts/AuthContext.tsx', code);
