 import React, { useState, useEffect } from 'react';

import { auth, db } from './firebaseConfig';

import { doc, onSnapshot } from "firebase/firestore"; // Quitamos getDoc porque no se usa

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



  const ADMIN_EMAIL = "alpeva2008@gmail.com";



  useEffect(() => {

    let unsubscribeDoc = () => {};



    const unsubscribeAuth = auth.onAuthStateChanged((user) => {

      if (user) {

        const userEmail = user.email.toLowerCase().trim();

        const adminEmailClean = ADMIN_EMAIL.toLowerCase().trim();

       

        setIsAdmin(userEmail === adminEmailClean);



        const userRef = doc(db, "usuarios", user.uid);

        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {

          if (docSnap.exists()) {

            setUserData(docSnap.data());

          }

          setScreen('menu');

        }, (error) => {

          console.error("Error en Snapshot:", error);

          setScreen('menu'); // Evita que se quede en loading si falla firestore

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



export default App;