import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc } from "firebase/firestore";

// Listas completas de tu código de Android Studio
const listaRegimenes = [
    { clave: "601", nombre: "Régimen General de Ley Personas Morales" },
    { clave: "602", nombre: "Régimen Simplificado de Ley Personas Morales" },
    { clave: "603", nombre: "Personas Morales con Fines No Lucrativos" },
    { clave: "604", nombre: "Régimen de Pequeños Contribuyentes" },
    { clave: "605", nombre: "Sueldos y Salarios e Ingresos Asimilados a Salarios" },
    { clave: "606", nombre: "Arrendamiento" },
    { clave: "607", nombre: "Enajenación o Adquisición de Bienes" },
    { clave: "608", nombre: "Demás Ingresos" },
    { clave: "609", nombre: "Consolidación" },
    { clave: "610", nombre: "Residentes en el Extranjero sin EP en México" },
    { clave: "611", nombre: "Ingresos por Dividendos" },
    { clave: "612", nombre: "Actividades Empresariales y Profesionales" },
    { clave: "613", nombre: "Régimen Intermedio PF" },
    { clave: "614", nombre: "Ingresos por Intereses" },
    { clave: "615", nombre: "Obtención de Premios" },
    { clave: "616", nombre: "Sin Obligaciones Fiscales" },
    { clave: "617", nombre: "PEMEX" },
    { clave: "618", nombre: "Régimen Simplificado PF" },
    { clave: "619", nombre: "Ingresos por Préstamos" },
    { clave: "620", nombre: "Sociedades Cooperativas de Producción" },
    { clave: "621", nombre: "Régimen de Incorporación Fiscal" },
    { clave: "622", nombre: "Actividades Agrícolas PM" },
    { clave: "623", nombre: "Opcional para Grupos de Sociedades" },
    { clave: "624", nombre: "Coordinados" },
    { clave: "625", nombre: "Plataformas Tecnológicas" },
    { clave: "626", nombre: "Régimen Simplificado de Confianza" }
];

const listaUsosCFDI = [
    { clave: "G01", descripcion: "Adquisición de mercancías" },
    { clave: "G02", descripcion: "Devoluciones, descuentos o bonificaciones" },
    { clave: "G03", descripcion: "Gastos en general" },
    { clave: "I01", descripcion: "Construcciones" },
    { clave: "I02", descripcion: "Mobiliario y equipo de oficina por inversiones" },
    { clave: "I03", descripcion: "Equipo de transporte" },
    { clave: "I04", descripcion: "Equipo de cómputo y accesorios" },
    { clave: "I05", descripcion: "Dados, troqueles, moldes, matrices y herramental" },
    { clave: "I06", descripcion: "Comunicaciones telefónicas" },
    { clave: "I07", descripcion: "Comunicaciones satelitales" },
    { clave: "I08", descripcion: "Otra maquinaria y equipo" },
    { clave: "D01", descripcion: "Honorarios médicos" },
    { clave: "D02", descripcion: "Gastos médicos por incapacidad" },
    { clave: "D03", descripcion: "Gastos funerales" },
    { clave: "D04", descripcion: "Donativos" },
    { clave: "D05", descripcion: "Intereses hipotecarios" },
    { clave: "D06", descripcion: "Aportaciones SAR" },
    { clave: "D07", descripcion: "Seguros de gastos médicos" },
    { clave: "D08", descripcion: "Transportación escolar" },
    { clave: "D09", descripcion: "Depósitos para el ahorro" },
    { clave: "D10", descripcion: "Colegaturas" },
    { clave: "S01", descripcion: "Sin efectos fiscales" },
    { clave: "CP01", descripcion: "Pagos" },
    { clave: "CN01", descripcion: "Nómina" }
];

const FacturacionScreen = ({ onBack }) => {
    const [form, setForm] = useState({
        rfc: "", nombre: "", cp: "", descripcion: "", 
        importe: "", notas: "", ivaTipo: "", 
        regimenClave: "", regimenNombre: "",
        usoClave: "", usoDescripcion: ""
    });
    const [enviando, setEnviando] = useState(false);

    const handleSubmit = async () => {
        if (!form.rfc || !form.nombre || !form.regimenClave || !form.usoClave || !form.ivaTipo) {
            return alert("Por favor llena todos los campos obligatorios");
        }

        setEnviando(true);
        try {
            await addDoc(collection(db, "facturaciones", auth.currentUser.uid, "facturas"), {
                ...form,
                fecha: new Date().toLocaleString('es-MX'),
                timestamp: Date.now()
            });
            alert("✅ Solicitud enviada correctamente");
            onBack();
        } catch (e) {
            alert("❌ Error al enviar");
        }
        setEnviando(false);
    };

    return (
        <div style={s.container}>
            <h2 style={s.title}>Solicitud de Factura</h2>
            
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
                <input placeholder="Nombre / Razón Social *" style={s.input} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                <input placeholder="Código Postal *" style={s.input} value={form.cp} maxLength={5} onChange={e => setForm({...form, cp: e.target.value.replace(/\D/g, '')})} />
                <input placeholder="Descripción de servicio *" style={s.input} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
                <input placeholder="Importe *" type="number" style={s.input} value={form.importe} onChange={e => setForm({...form, importe: e.target.value})} />
                <textarea placeholder="Notas" style={{...s.input, height: '60px'}} value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />

                <label style={s.label}>Tipo de IVA *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setForm({...form, ivaTipo: "Mas IVA"})} style={{ ...s.ivaBtn, backgroundColor: form.ivaTipo === "Mas IVA" ? "#1976d2" : "#ccc" }}>+ IVA</button>
                    <button onClick={() => setForm({...form, ivaTipo: "IVA Incluido"})} style={{ ...s.ivaBtn, backgroundColor: form.ivaTipo === "IVA Incluido" ? "#1976d2" : "#ccc" }}>IVA Incluido</button>
                </div>

                <button onClick={handleSubmit} disabled={enviando} style={s.mainBtn}>{enviando ? "Enviando..." : "Enviar Solicitud"}</button>
                <button onClick={onBack} style={s.secBtn}>Regresar</button>
            </div>
        </div>
    );
};

const s = {
    container: { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    title: { textAlign: 'center', color: '#333', marginBottom: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
    label: { fontSize: '11px', fontWeight: 'bold', color: '#1976d2', marginTop: '5px' },
    input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px' },
    ivaBtn: { flex: 1, padding: '10px', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    mainBtn: { padding: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' },
    secBtn: { padding: '10px', backgroundColor: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' }
};

export default FacturacionScreen;