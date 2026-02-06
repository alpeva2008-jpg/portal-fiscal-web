import React, { useState, useEffect } from 'react';
// Asegúrate de que estos nombres de archivo sean exactos a los que tienes en tu carpeta
import { auth, db } from './firebaseConfig';
import { doc, onSnapshot } from "firebase/firestore";

// Importación de Pantallas
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import MenuScreen from './components/MenuScreen';
import AdminScreen from './components/AdminScreen';
import HonorariosScreen from './components/HonorariosScreen';
import FacturacionScreen from './components/FacturacionScreen';
import VistaCliente from './components/VistaCliente';

function App() {
  const [screen, setScreen] = useState('loading');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);

  const ADMIN_EMAIL = "alpeva2008@gmail.com";

  const handleNavigate = (seccion) => {
    setScreen(seccion);
  };

  useEffect(() => {
    let unsubscribeDoc = () => {};
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userEmail = user.email.toLowerCase().trim();
        setIsAdmin(userEmail === ADMIN_EMAIL.toLowerCase().trim());

        const userRef = doc(db, "usuarios", user.uid);
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
          setScreen('menu');
        }, (error) => {
          console.error("Error en Snapshot:", error);
          setScreen('menu');
        });
      } else {
        setScreen('login');
        setIsAdmin(false);
        setUserData(null);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDoc();
    };
  }, []);

  if (screen === 'loading') {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#333' }}>Cargando Portal...</h2>
      </div>
    );
  }

  const seccionesDeArchivos = ['facturas', 'declaraciones', 'constancia', 'opinion32d'];

  return (
    <div className="App">
      {/* Login y Registro */}
      {screen === 'login' && (
        <LoginScreen
          onLoginSuccess={() => setScreen('menu')}
          onGoToRegister={() => setScreen('register')}
        />
      )}
      
      {screen === 'register' && (
        <RegisterScreen onBack={() => setScreen('login')} />
      )}
      
      {screen === 'menu' && (
        <MenuScreen
          onLogout={() => auth.signOut()}
          onNavigate={handleNavigate}
          showAdminBtn={isAdmin}
          modulosActivos={userData?.modulosActivos}
        />
      )}
      
      {screen === 'admin' && <AdminScreen onBack={() => setScreen('menu')} />}

      {/* Pantallas Especiales */}
      {screen === 'facturacion' && (
        <FacturacionScreen 
          userId={auth.currentUser?.uid} 
          onBack={() => setScreen('menu')} 
          nombreCliente={userData?.nombre || "Usuario del Portal"} 
        />
      )}

      {screen === 'honorarios' && (
  <HonorariosScreen 
    datosPago={userData?.datosPago} // <--- ESTA ES LA LÍNEA CLAVE
    onBack={() => setScreen('menu')} 
  />
)}

      {/* Visor Genérico de Archivos */}
      {seccionesDeArchivos.includes(screen) && (
        <VistaCliente 
          userId={auth.currentUser?.uid} 
          seccion={screen} 
          onBack={() => setScreen('menu')} 
        />
      )}
    </div>
  );
}

export default App;