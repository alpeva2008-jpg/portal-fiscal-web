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
  const MODO_MANTENIMIENTO = true; 
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

  // 1. Pantalla de carga
  if (screen === 'loading') {
    return (
      <div style={styles.center}>
        <h2 style={{ color: '#333' }}>Cargando Portal...</h2>
      </div>
    );
  }

  // 2. Si no hay usuario, forzar Login (no importa si hay mantenimiento o no)
  if (screen === 'login') {
    return <LoginScreen 
             onLoginSuccess={() => setScreen('menu')} 
             onGoToRegister={() => setScreen('register')} 
           />;
  }

  if (screen === 'register') {
    return <RegisterScreen onBack={() => setScreen('login')} />;
  }

  // 3. BLOQUEO CRÍTICO: Si el mantenimiento está activo y NO es el admin.
  // Se ejecuta después del login para saber quién es el usuario.
  if (MODO_MANTENIMIENTO && !isAdmin) {
    return (
      <div style={styles.mantenimientoContainer}>
        <h1 style={styles.titulo}>Portal Fiscal Autónomo</h1>
        <div style={styles.icono}>⚙️</div>
        <h2 style={{color: '#d32f2f'}}>Actualización en curso</h2>
        <p>Estamos instalando el nuevo Módulo de Facturación para mejorar tu experiencia.</p>
        <p style={styles.subtexto}>El acceso para clientes estará disponible en breve.</p>
        <button onClick={() => auth.signOut()} style={styles.btnSalir}>Cerrar Sesión para reintentar</button>
      </div>
    );
  }

  // 4. Si pasó todos los filtros, mostramos la App normal
  return (
    <div className="App">
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

const styles = {
  center: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' },
  mantenimientoContainer: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', padding: '20px' },
  titulo: { fontSize: '26px', fontWeight: 'bold', color: '#333', marginBottom: '10px' },
  icono: { fontSize: '60px', margin: '20px 0' },
  subtexto: { color: '#888', marginTop: '10px', fontStyle: 'italic' },
  btnSalir: { marginTop: '30px', padding: '12px 25px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default App;