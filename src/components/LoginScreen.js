import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

const LoginScreen = ({ onLoginSuccess, onGoToRegister }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [mensajeRecuperacion, setMensajeRecuperacion] = useState("");

    const handleLogin = async () => {
        setError("");
        setMensajeRecuperacion("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
        } catch (err) {
            setError("❌ Correo o contraseña incorrectos.");
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            alert("📍 ¡Ups! Necesitamos saber a quién ayudar. \n\nPor favor, escribe tu correo electrónico y vuelve a intentarlo.");
            return;
        }
        setError("");
        setMensajeRecuperacion("");
        try {
            await sendPasswordResetEmail(auth, email);
            const mensajeExito = `📧 ¡Listo! Enlace enviado a ${email} revisa Bandeja de entrada o Spam`;
            setMensajeRecuperacion(mensajeExito);
            alert("✅ ¡Correo enviado! Revisa tu Bandeja de entrada o Spam.");
        } catch (err) {
            setError("⚠️ Error: " + err.message);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.decorCircle1}></div>
            <div style={styles.decorCircle2}></div>

            <div style={styles.card}>
                <div style={styles.logoArea}>
                    <img 
                        src="/logo_despacho.png" 
                        alt="Logotipo Despacho" 
                        style={styles.logoImage} 
                    />
                    <h2 style={styles.title}>Clientes DP & Asociados</h2>
                </div>
                
                <p style={styles.subtitle}>Bienvenido. Ingrese sus Datos.</p>

                <input 
                    type="email" 
                    placeholder="Correo electrónico" 
                    style={styles.input} 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />
                
                <input 
                    type="password" 
                    placeholder="Contraseña" 
                    style={styles.input} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />
                
                <button onClick={handleLogin} style={styles.button}>
                    Iniciar Sesión
                </button>
                
                <button onClick={handleResetPassword} style={styles.textButtonMini}>
                    ¿Olvidaste tu contraseña?
                </button>

                <hr style={styles.divider} />

                <button onClick={onGoToRegister} style={styles.textButton}>
                    ¿No tienes cuenta? Regístrate aquí
                </button>

                <div style={{minHeight: '40px', marginTop: '10px'}}>
                    {error && <p style={styles.errorText}>{error}</p>}
                    {mensajeRecuperacion && <p style={styles.successText}>{mensajeRecuperacion}</p>}
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
        // FONDO SIDERAL UNIFICADO
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        fontFamily: 'Segoe UI, Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden'
    },
    decorCircle1: {
        position: 'absolute', top: '-10%', left: '-5%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
    },
    decorCircle2: {
        position: 'absolute', bottom: '-10%', right: '-5%', width: '300px', height: '300px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
    },
    card: { 
        padding: '40px', 
        // CRISTAL OSCURO
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
        width: '140px',
        height: 'auto', 
        marginBottom: '15px',
        filter: 'brightness(1.1) drop-shadow(0 4px 10px rgba(0,0,0,0.4))'
    },
    title: { 
        color: '#ffffff', 
        fontSize: '20px', 
        fontWeight: '700', 
        margin: 0,
        letterSpacing: '0.5px' 
    },
    subtitle: { 
        color: 'rgba(255,255,255,0.6)', 
        fontSize: '13px', 
        marginBottom: '25px',
        letterSpacing: '1px'
    },
    input: { 
        width: '100%', 
        padding: '14px 15px', 
        marginBottom: '15px', 
        borderRadius: '16px', 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        boxSizing: 'border-box', 
        fontSize: '15px', 
        outline: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'white'
    },
    button: { 
        width: '100%', 
        padding: '14px', 
        // GRADIENTE AZUL ACERO (Combinando con el menú)
        background: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)', 
        color: 'white', 
        border: 'none', 
        borderRadius: '16px', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        fontSize: '16px',
        boxShadow: '0 8px 15px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s'
    },
    divider: { border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' },
    textButton: { 
        background: 'none', 
        border: 'none', 
        color: '#4286f4', 
        cursor: 'pointer', 
        fontSize: '14px', 
        fontWeight: 'bold' 
    },
    textButtonMini: { 
        background: 'none', 
        border: 'none', 
        color: 'rgba(255,255,255,0.4)', 
        marginTop: '12px', 
        cursor: 'pointer', 
        fontSize: '11px', 
        textDecoration: 'underline' 
    },
    errorText: { color: '#ff4d4d', fontSize: '12px', fontWeight: 'bold' },
    successText: { color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }
};

export default LoginScreen;