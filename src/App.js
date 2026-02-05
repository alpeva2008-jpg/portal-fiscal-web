import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { doc, onSnapshot } from "firebase/firestore"; 
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import MenuScreen from './components/MenuScreen';
import FacturasScreen from './components/FacturasScreen';
import DeclaracionesScreen from './components/DeclaracionesScreen';
import ConstanciaScreen from './components/ConstanciaScreen';
import Opinion32DScreen from './components/Opinion32DScreen';
import FacturacionScreen from './components/FacturacionScreen';
import HonorariosScreen from './components/HonorariosScreen';
import AdminScreen from './components/AdminScreen';

function App() {
  const [screen, setScreen] = useState('loading');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null); 

  // --- CONFIGURACIÓN DE MANTENIMIENTO ---
  const MODO_MANTENIMIENTO = true; // Cambia a false para abrir el portal a todos
  const ADMIN_EMAIL = "alpeva2008@gmail.com"; 
  // --------------------------------------

  useEffect(() => {
    let unsubscribeDoc = () => {}; 

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userEmail = user.email.toLowerCase().trim();
        const adminEmailClean = ADMIN_EMAIL.toLowerCase().trim();
        const checkAdmin = userEmail === adminEmailClean;
        
        setIsAdmin(checkAdmin);

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
      <div style={styles.center}>
        <h2 style={{ color: '#333' }}>Cargando Portal...</h2>
      </div>
    );
  }

  // --- LÓGICA DE BLOQUEO POR MANTENIMIENTO ---
  // Si el mantenimiento está activo y NO eres el admin, mostramos la pantalla de aviso.
  if (MODO_MANTENIMIENTO && !isAdmin && screen !== 'login') {
    return (
      <div style={styles.mantenimientoContainer}>
        <h1 style={styles.titulo}>Portal Fiscal Autónomo</h1>
        <div style={styles.icono}>⚙️</div>
        <h2>Actualización en curso</h2>
        <p>Estamos instalando el nuevo Módulo de Facturación para mejorar tu experiencia.</p>
        <p style={styles.subtexto}>Volveremos en breve. Gracias por tu paciencia.</p>
        <button onClick={() => auth.signOut()} style={styles.btnSalir}>Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <div className="App">
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
          onNavigate={(target) => setScreen(target)} 
          showAdminBtn={isAdmin} 
          modulosActivos={userData?.modulosActivos} 
        />
      )}
      
      {screen === 'admin' && <AdminScreen onBack={() => setScreen('menu')} />}
      {screen === 'facturas' && <FacturasScreen onBack={() => setScreen('menu')} />}
      {screen === 'declaraciones' && <DeclaracionesScreen onBack={() => setScreen('menu')} />}
      {screen === 'constancia' && <ConstanciaScreen onBack={() => setScreen('menu')} />}
      {screen === 'opinion32d' && <Opinion32DScreen onBack={() => setScreen('menu')} />}
      {screen === 'facturacion' && <FacturacionScreen onBack={() => setScreen('menu')} />}
      {screen === 'honorarios' && <HonorariosScreen onBack={() => setScreen('menu')} />}
    </div>
  );
}

// Estilos rápidos para el aviso
const styles = {
  center: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' },
  mantenimientoContainer: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#fff', padding: '20px' },
  titulo: { fontSize: '22px', fontWeight: 'bold', color: '#000' },
  icono: { fontSize: '50px', margin: '20px 0' },
  subtexto: { color: '#666', marginTop: '10px' },
  btnSalir: { marginTop: '30px', padding: '10px 20px', backgroundColor: '#eee', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default App;