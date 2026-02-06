import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const RegisterScreen = ({ onBack }) => {
    const [nombre, setNombre] = useState("");
    const [rfc, setRfc] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [exito, setExito] = useState(false);

    useEffect(() => {
        if (exito) {
            const timer = setTimeout(() => onBack(), 1500);
            return () => clearTimeout(timer);
        }
    }, [exito, onBack]);

    const handleRegister = async () => {
        if (!nombre || !rfc || !email || !password) return setMensaje("⚠️ Llena todos los campos");
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "usuarios", userCred.user.uid), { nombre, rfc, email });
            setMensaje("✅ ¡Registro exitoso!");
            setExito(true);
        } catch (err) {
            setMensaje("❌ Error: " + err.message);
        }
    };

    return (
        <div style={styles.container}>
            {/* ELEMENTOS VISUALES DE FONDO */}
            <div style={styles.decorCircle1}></div>
            <div style={styles.decorCircle2}></div>

            <div style={styles.card}>
                <div style={styles.logoArea}>
                    <img 
                        src="/logo_despacho.png" 
                        alt="Logotipo Despacho" 
                        style={styles.logoImage} 
                    />
                    <h2 style={styles.title}>Nuevo Registro</h2>
                </div>

                <p style={styles.subtitle}>Cree su cuenta para acceder al portal.</p>
                
                <input placeholder="Nombre Completo" style={styles.input} onChange={e => setNombre(e.target.value)} />
                <input placeholder="RFC" style={styles.input} onChange={e => setRfc(e.target.value.toUpperCase())} />
                <input placeholder="Correo Electrónico" style={styles.input} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Contraseña" style={styles.input} onChange={e => setPassword(e.target.value)} />
                
                <button onClick={handleRegister} style={styles.button}>
                    Finalizar Registro
                </button>
                
                <button onClick={onBack} style={styles.textButton}>
                    ← Volver al Inicio
                </button>

                <div style={{minHeight: '25px', marginTop: '15px'}}>
                    <p style={{...styles.messageText, color: exito ? '#4CAF50' : '#ff4d4d'}}>
                        {mensaje}
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { 
        display: 'flex', 
        height: '100vh', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        fontFamily: 'Segoe UI, Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden'
    },
    decorCircle1: {
        position: 'absolute', top: '-5%', left: '-5%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
    },
    decorCircle2: {
        position: 'absolute', bottom: '-5%', right: '-5%', width: '300px', height: '300px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
    },
    card: { 
        padding: '40px', 
        backgroundColor: 'rgba(15, 32, 39, 0.85)', 
        borderRadius: '32px', 
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)', 
        textAlign: 'center', 
        width: '360px',
        zIndex: 1,
        backdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    logoArea: { marginBottom: '15px' },
    logoImage: { 
        width: '120px',
        height: 'auto', 
        marginBottom: '10px',
        filter: 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
    },
    title: { 
        color: '#ffffff', 
        fontSize: '22px', 
        fontWeight: '700', 
        margin: 0,
        letterSpacing: '0.5px' 
    },
    subtitle: { 
        color: 'rgba(255,255,255,0.5)', 
        fontSize: '13px', 
        marginBottom: '20px'
    },
    input: { 
        width: '100%', 
        padding: '12px 15px', 
        marginBottom: '12px', 
        borderRadius: '14px', 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        boxSizing: 'border-box', 
        fontSize: '14px', 
        outline: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'white'
    },
    button: { 
        width: '100%', 
        padding: '14px', 
        background: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)', 
        color: 'white', 
        border: 'none', 
        borderRadius: '14px', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        fontSize: '16px',
        boxShadow: '0 8px 15px rgba(0,0,0,0.3)',
        marginTop: '10px'
    },
    textButton: { 
        background: 'none', 
        border: 'none', 
        color: 'rgba(255,255,255,0.6)', 
        marginTop: '15px', 
        cursor: 'pointer', 
        fontSize: '14px',
        fontWeight: '500'
    },
    messageText: {
        fontSize: '13px',
        fontWeight: '600',
        margin: 0
    }
};

export default RegisterScreen;