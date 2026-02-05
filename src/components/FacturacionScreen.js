import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc } from "firebase/firestore";

// ... (Tus listas de regimenes y usos se mantienen igual arriba)

const FacturacionScreen = ({ onBack }) => {
    const [form, setForm] = useState({
        rfc: "", nombre: "", cp: "", descripcion: "", 
        importe: "", notas: "", ivaTipo: "", 
        regimenClave: "", regimenNombre: "",
        usoClave: "", usoDescripcion: ""
    });
    const [enviando, setEnviando] = useState(false);
    const [confirmado, setConfirmado] = useState(false); // NUEVO: Para el mensaje de advertencia

    const handleSubmit = async () => {
        // 1. Validaciones Estrictas (Mapa de Requisitos)
        if (!form.rfc || form.rfc.length < 12) return alert("RFC incompleto o inválido");
        if (!form.cp || form.cp.length !== 5) return alert("El Código Postal debe ser de 5 dígitos");
        if (!form.nombre || !form.regimenClave || !form.usoClave || !form.ivaTipo || !form.descripcion || !form.importe) {
            return alert("Por favor llena todos los campos obligatorios (*)");
        }
        
        if (!confirmado) {
            return alert("Debes marcar la casilla de confirmación de datos.");
        }

        setEnviando(true);
        try {
            // Guardamos en una colección global "solicitudes_facturacion" para que el Admin las vea todas juntas
            await addDoc(collection(db, "solicitudes_facturacion"), {
                ...form,
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email,
                userName: auth.currentUser.displayName || "Usuario Sin Nombre",
                estado: "pendiente", // Para tu panel de Admin
                fecha: new Date().toLocaleString('es-MX'),
                timestamp: Date.now()
            });
            
            alert("✅ Solicitud enviada. El administrador recibirá una notificación.");
            onBack();
        } catch (e) {
            alert("❌ Error al enviar: " + e.message);
        }
        setEnviando(false);
    };

    return (
        <div style={s.container}>
            <h2 style={s.title}>Portal Fiscal Autónomo</h2>
            <p style={{textAlign: 'center', fontSize: '13px', color: '#666', marginBottom: '20px'}}>Solicitud de Factura Electrónica</p>
            
            <div style={s.formGroup}>
                <label style={s.label}>Régimen Fiscal *</label>
                <select 
                    style={s.input} 
                    onChange={e => {
                        const reg = listaRegimenes.find(r => r.clave === e.target.value);
                        setForm({...form, regimenClave: reg?.clave || "", regimenNombre: reg?.nombre || ""});
                    }}
                >
                    <option value="">Seleccione...</option>
                    {listaRegimenes.map(r => <option key={r.clave} value={r.clave}>{r.clave} - {r.nombre}</option>)}
                </select>

                <label style={s.label}>Uso CFDI *</label>
                <select 
                    style={s.input} 
                    onChange={e => {
                        const uso = listaUsosCFDI.find(u => u.clave === e.target.value);
                        setForm({...form, usoClave: uso?.clave || "", usoDescripcion: uso?.descripcion || ""});
                    }}
                >
                    <option value="">Seleccione...</option>
                    {listaUsosCFDI.map(u => <option key={u.clave} value={u.clave}>{u.clave} - {u.descripcion}</option>)}
                </select>

                <input placeholder="RFC *" style={s.input} value={form.rfc} maxLength={13} onChange={e => setForm({...form, rfc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})} />
                <input placeholder="Nombre / Razón Social *" style={s.input} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value.toUpperCase()})} />
                <input placeholder="Código Postal *" style={s.input} value={form.cp} maxLength={5} onChange={e => setForm({...form, cp: e.target.value.replace(/\D/g, '')})} />
                <input placeholder="Descripción de servicio *" style={s.input} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
                <input placeholder="Importe total (con número) *" type="number" style={s.input} value={form.importe} onChange={e => setForm({...form, importe: e.target.value})} />
                <textarea placeholder="Notas adicionales para el despacho" style={{...s.input, height: '60px'}} value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />

                <label style={s.label}>Tipo de IVA *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setForm({...form, ivaTipo: "Mas IVA"})} style={{ ...s.ivaBtn, backgroundColor: form.ivaTipo === "Mas IVA" ? "#1976d2" : "#ccc" }}>+ IVA</button>
                    <button onClick={() => setForm({...form, ivaTipo: "IVA Incluido"})} style={{ ...s.ivaBtn, backgroundColor: form.ivaTipo === "IVA Incluido" ? "#1976d2" : "#ccc" }}>IVA Incluido</button>
                </div>

                {/* MENSAJE DE ADVERTENCIA (Check-list) */}
                <div style={s.advertenciaBox}>
                    <input 
                        type="checkbox" 
                        id="confirmar" 
                        checked={confirmado} 
                        onChange={(e) => setConfirmado(e.target.checked)} 
                    />
                    <label htmlFor="confirmar" style={{fontSize: '12px', color: '#d32f2f', fontWeight: 'bold'}}>
                        Confirmo que mis datos son correctos y coinciden con mi CSF.
                    </label>
                </div>

                <button 
                    onClick={handleSubmit} 
                    disabled={enviando || !confirmado} 
                    style={{...s.mainBtn, opacity: confirmado ? 1 : 0.5}}
                >
                    {enviando ? "Enviando..." : "Enviar Solicitud"}
                </button>
                <button onClick={onBack} style={s.secBtn}>Cancelar</button>
            </div>
        </div>
    );
};

const s = {
    // ... Tus estilos originales ...
    container: { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    title: { textAlign: 'center', color: '#1976d2', marginBottom: '5px', fontWeight: 'bold' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
    label: { fontSize: '11px', fontWeight: 'bold', color: '#1976d2', marginTop: '5px' },
    input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px' },
    ivaBtn: { flex: 1, padding: '10px', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    mainBtn: { padding: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' },
    secBtn: { padding: '10px', backgroundColor: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' },
    // Estilo nuevo
    advertenciaBox: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        backgroundColor: '#fff3f3', 
        padding: '10px', 
        borderRadius: '5px', 
        border: '1px solid #ffcdd2',
        marginTop: '10px'
    }
};

export default FacturacionScreen;