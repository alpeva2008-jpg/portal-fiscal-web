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
        if (!nombre || !rfc || !email || !password) return setMensaje("Llena todos los campos");
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "usuarios", userCred.user.uid), { nombre, rfc, email });
            setMensaje("¡Registro exitoso!");
            setExito(true);
        } catch (err) {
            setMensaje("Error: " + err.message);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h3>Registro</h3>
                <input placeholder="Nombre" style={styles.input} onChange={e => setNombre(e.target.value)} />
                <input placeholder="RFC" style={styles.input} onChange={e => setRfc(e.target.value.toUpperCase())} />
                <input placeholder="Correo" style={styles.input} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Contraseña" style={styles.input} onChange={e => setPassword(e.target.value)} />
                <button onClick={handleRegister} style={styles.button}>Registrar</button>
                <button onClick={onBack} style={styles.textButton}>Volver</button>
                <p>{mensaje}</p>
            </div>
        </div>
    );
};
const styles = {
    container: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
    card: { padding: '30px', backgroundColor: 'white', borderRadius: '12px', width: '300px', textAlign: 'center' },
    input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    textButton: { background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer' }
};
export default RegisterScreen;