import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth";

const LoginScreen = ({ onLoginSuccess, onGoToRegister }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
        } catch (err) {
            setError("Correo o contraseña incorrectos");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Portal de Clientes</h2>
                <input 
                    type="email" placeholder="Correo" style={styles.input} 
                    value={email} onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                    type="password" placeholder="Contraseña" style={styles.input} 
                    value={password} onChange={(e) => setPassword(e.target.value)} 
                />
                <button onClick={handleLogin} style={styles.button}>Entrar</button>
                <button onClick={onGoToRegister} style={styles.textButton}>¿No tienes cuenta? Regístrate</button>
                {error && <p style={{color: 'red'}}>{error}</p>}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
    card: { padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', width: '300px' },
    title: { marginBottom: '20px', color: '#333' },
    input: { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    textButton: { background: 'none', border: 'none', color: '#2196F3', marginTop: '15px', cursor: 'pointer' }
};

export default LoginScreen;