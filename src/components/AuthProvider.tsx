import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserConfig } from '../types';

interface AuthContextType {
  user: User | null;
  config: UserConfig | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  updateConfig: (newConfig: UserConfig) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  config: null,
  loading: true,
  signInWithGoogle: async () => {},
  logOut: async () => {},
  updateConfig: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserConfig(currentUser.uid);
      } else {
        setConfig(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserConfig = async (userId: string) => {
    try {
      // First make sure user document exists
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            email: auth.currentUser?.email || '',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, `users/${userId}`);
        }
      }

      const configRef = doc(db, `users/${userId}/configs/default`);
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setConfig({ id: configSnap.id, ...configSnap.data() } as UserConfig);
      } else {
        const defaultConfig: Omit<UserConfig, 'id'> = {
          userId,
          categories: {
            performance: { 
              criteria: [
                { id: 'p1', name: 'Pase Corto', group: 'Técnica' }, 
                { id: 'p2', name: 'Pase Largo', group: 'Técnica' },
                { id: 'p3', name: 'Regate', group: 'Técnica' },
                { id: 'p4', name: 'Control de Balón', group: 'Técnica' },
                { id: 'p5', name: 'Visión', group: 'Creatividad' },
                { id: 'p6', name: 'Asistencias', group: 'Creatividad' },
                { id: 'p7', name: 'Último pase', group: 'Creatividad' },
                { id: 'p8', name: 'Inicio de Jugada', group: 'Creatividad' },
                { id: 'p9', name: 'Resistencia', group: 'Físico' },
                { id: 'p10', name: 'Velocidad', group: 'Físico' },
                { id: 'p11', name: 'Lucha', group: 'Físico' },
                { id: 'p12', name: 'Fuerza', group: 'Físico' },
                { id: 'p13', name: 'Posicionamiento', group: 'Mental' },
                { id: 'p14', name: 'Lectura de Juego', group: 'Mental' },
                { id: 'p15', name: 'Volumen de trabajo', group: 'Mental' },
                { id: 'p16', name: 'Enfoque', group: 'Mental' },
              ] 
            },
            injuries: { criteria: [{ id: 'i1', name: 'Frecuencia de lesiones' }, { id: 'i2', name: 'Condición General' }] },
            psychological: { 
              criteria: [
                { id: 'ps1', name: 'Resiliencia al error', group: 'Robustez Mental y Gestión de Crisis' }, 
                { id: 'ps2', name: 'Gestión del Estrés', group: 'Robustez Mental y Gestión de Crisis' },
                { id: 'ps3', name: 'Aceptación de la suplencia/rotación', group: 'Robustez Mental y Gestión de Crisis' },
                { id: 'ps4', name: 'Velocidad de procesamiento', group: 'Cognición y Toma de Decisiones de Élite' },
                { id: 'ps5', name: 'Atención selectiva', group: 'Cognición y Toma de Decisiones de Élite' },
                { id: 'ps6', name: 'Flexibilidad cognitiva', group: 'Cognición y Toma de Decisiones de Élite' },
                { id: 'ps7', name: 'Comunicación asertiva', group: 'Liderazgo y Dinámica de Vestuario' },
                { id: 'ps8', name: 'Inteligencia emocional', group: 'Liderazgo y Dinámica de Vestuario' },
                { id: 'ps9', name: 'Liderazgo situacional', group: 'Liderazgo y Dinámica de Vestuario' },
                { id: 'ps10', name: 'Mentalidad de crecimiento', group: 'Profesionalismo y Consistencia' },
                { id: 'ps11', name: 'Disciplina invisible', group: 'Profesionalismo y Consistencia' },
                { id: 'ps12', name: 'Cohesión grupal', group: 'Trabajo en Equipo y Comunicación' },
                { id: 'ps13', name: 'Comunicación efectiva', group: 'Trabajo en Equipo y Comunicación' },
              ] 
            },
          },
          updatedAt: Date.now(),
        };
        try {
          await setDoc(configRef, defaultConfig);
          setConfig({ id: 'default', ...defaultConfig });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, `users/${userId}/configs/default`);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  const updateConfig = async (newConfig: UserConfig) => {
    if (!user) return;
    try {
      const configRef = doc(db, `users/${user.uid}/configs/default`);
      const dataToUpdate = { ...newConfig, updatedAt: Date.now() };
      await setDoc(configRef, dataToUpdate);
      setConfig(dataToUpdate);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/configs/default`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, config, loading, signInWithGoogle, logOut, updateConfig }}>
      {children}
    </AuthContext.Provider>
  );
}
