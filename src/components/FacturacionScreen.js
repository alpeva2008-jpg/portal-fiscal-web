import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc } from "firebase/firestore";
import emailjs from '@emailjs/browser';
import { FaFileInvoice, FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// --- LISTAS DE CATÁLOGOS INTACTAS ---
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

const listaFormasPago = [
    { clave: "01", nombre: "Efectivo" },
    { clave: "02", nombre: "Cheque nominativo" },
    { clave: "03", nombre: "Transferencia electrónica de fondos" },
    { clave: "04", nombre: "Tarjeta de crédito" },
    { clave: "05", nombre: "Monedero electrónico" },
    { clave: "06", nombre: "Dinero electrónico" },
    { clave: "08", nombre: "Vales de despensa" },
    { clave: "12", nombre: "Dación en pago" },
    { clave: "13", nombre: "Pago por subrogación" },
    { clave: "14", nombre: "Pago por consignación" },
    { clave: "15", nombre: "Condonación" },
    { clave: "17", nombre: "Compensación" },
    { clave: "23", nombre: "Novación" },
    { clave: "24", nombre: "Confusión" },
    { clave: "25", nombre: "Remisión de deuda" },
    { clave: "26", nombre: "Prescripción o caducidad" },
    { clave: "27", nombre: "A satisfacción del acreedor" },
    { clave: "28", nombre: "Tarjeta de débito" },
    { clave: "29", nombre: "Tarjeta de servicios" },
    { clave: "30", nombre: "Aplicación de anticipos" },
    { clave: "99", nombre: "Por definir" }
];

const listaMetodosPago = [
    { clave: "PUE", nombre: "Pago de Una Sola Exhibición" },
    { clave: "PPD", nombre: "Pago en Parcialidades o Diferidos" }
];

const FacturacionScreen = ({ onBack, nombreCliente }) => {
    const estadoInicial = {
        rfc: "", nombre: "", cp: "", descripcion: "", 
        importe: "", notas: "", ivaTipo: "", 
        regimenClave: "", regimenNombre: "",
        usoClave: "", usoDescripcion: "",
        formaPago: "", metodoPago: ""
    };

    const [form, setForm] = useState(estadoInicial);
    const [errores, setErrores] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [aceptoTerminos, setAceptoTerminos] = useState(false);

    // LÓGICA INTACTA
    const formularioValido = 
        form.rfc && form.nombre && form.cp && form.descripcion && 
        form.importe && form.regimenClave && form.usoClave && form.ivaTipo &&
        form.formaPago && form.metodoPago &&
        !errores.rfc && !errores.cp;

    const handleBlurImporte = () => {
        if (form.importe) {
            const valorFijo = parseFloat(form.importe).toFixed(2);
            setForm(prev => ({ ...prev, importe: valorFijo }));
        }
    };

    const handleChange = (e) => {
        if (enviando) return;
        const { name, value } = e.target;
        let valorProcesado = value;

        if (name === "rfc") valorProcesado = value.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, '');
        if (name === "cp") valorProcesado = value.replace(/\D/g, '');
        if (name === "nombre") valorProcesado = value.toUpperCase();

        setForm(prev => ({ ...prev, [name]: valorProcesado }));

        let mensajeError = "";
        if (name === "rfc" && valorProcesado.length > 0 && (valorProcesado.length < 12 || valorProcesado.length > 13)) {
            mensajeError = "El RFC debe contener 12 o 13 caracteres";
        }
        if (name === "cp" && valorProcesado.length > 0 && valorProcesado.length !== 5) {
            mensajeError = "Debe tener 5 dígitos";
        }
        setErrores(prev => ({ ...prev, [name]: mensajeError }));
    };

    const handleSubmit = async () => {
        if (!formularioValido || !aceptoTerminos) return;
        setEnviando(true);
        try {
            await addDoc(collection(db, "facturaciones", auth.currentUser.uid, "facturas"), {
                ...form,
                estado: "pendiente",
                fecha: new Date().toLocaleString('es-MX'),
                timestamp: Date.now()
            });

            const SERVICE_ID = "service_4e756ev";
            const TEMPLATE_ID_ADMIN = "template_z8ubq1r"; 
            const PUBLIC_KEY = "tKfQFx27GXLv2ohaH";

            const templateParams = {
                nombre_cliente: String(nombreCliente || "Cliente Registrado"),
                mensaje: `
                    RFC: ${form.rfc}
                    Nombre: ${form.nombre}
                    CP: ${form.cp}
                    Régimen: ${form.regimenClave}
                    Uso CFDI: ${form.usoClave}
                    Método: ${form.metodoPago}
                    Forma: ${form.formaPago}
                    Descripción: ${form.descripcion}
                    Importe: $${form.importe} (${form.ivaTipo})
                    Notas: ${form.notas || "Sin notas"}
                `,
            };

            await emailjs.send(SERVICE_ID, TEMPLATE_ID_ADMIN, templateParams, PUBLIC_KEY);

            alert("✅ Solicitud enviada correctamente.");
            setForm(estadoInicial);
            setAceptoTerminos(false);
            onBack();
        } catch (e) {
            alert("❌ Error: " + (e.text || "Error de conexión"));
        }
        setEnviando(false);
    };

    return (
        <div style={s.mainContainer}>
            {/* ELEMENTOS DE FONDO */}
            <div style={s.decorCircle1}></div>
            
            <div style={{...s.card, opacity: enviando ? 0.7 : 1}}>
                <div style={s.header}>
                    <button onClick={onBack} style={s.btnBackIcon}><FaArrowLeft /></button>
                    <h2 style={s.title}>Solicitud de Factura</h2>
                    <div style={{width: '24px'}}></div> {/* Spacer */}
                </div>

                <div style={s.scrollArea}>
                    <p style={s.instrucciones}>Complete los datos fiscales del receptor de la factura.</p>

                    <label style={s.label}>Régimen Fiscal *</label>
                    <select style={s.select} value={form.regimenClave} onChange={e => {
                        const reg = listaRegimenes.find(r => r.clave === e.target.value);
                        setForm({...form, regimenClave: reg?.clave || "", regimenNombre: reg?.nombre || ""});
                    }}>
                        <option value="">Seleccione un régimen...</option>
                        {listaRegimenes.map(r => <option key={r.clave} value={r.clave}>{r.clave} - {r.nombre}</option>)}
                    </select>

                    <label style={s.label}>Uso CFDI *</label>
                    <select style={s.select} value={form.usoClave} onChange={e => {
                        const uso = listaUsosCFDI.find(u => u.clave === e.target.value);
                        setForm({...form, usoClave: uso?.clave || "", usoDescripcion: uso?.descripcion || ""});
                    }}>
                        <option value="">Seleccione uso...</option>
                        {listaUsosCFDI.map(u => <option key={u.clave} value={u.clave}>{u.clave} - {u.descripcion}</option>)}
                    </select>

                    <div style={s.row}>
                        <div style={{flex: 1}}>
                            <label style={s.label}>Método de Pago *</label>
                            <select name="metodoPago" style={s.select} value={form.metodoPago} onChange={handleChange}>
                                <option value="">...</option>
                                {listaMetodosPago.map(m => <option key={m.clave} value={m.clave}>{m.clave}</option>)}
                            </select>
                        </div>
                        <div style={{flex: 1}}>
                            <label style={s.label}>Forma de Pago *</label>
                            <select name="formaPago" style={s.select} value={form.formaPago} onChange={handleChange}>
                                <option value="">...</option>
                                {listaFormasPago.map(f => <option key={f.clave} value={f.clave}>{f.clave}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={s.inputWrapper}>
                        <label style={s.label}>RFC del Receptor *</label>
                        <input name="rfc" placeholder="ABCD800101XXX" style={{...s.input, borderColor: errores.rfc ? '#ff4d4d' : 'rgba(255,255,255,0.1)'}} value={form.rfc} maxLength={13} onChange={handleChange} />
                        {errores.rfc && <span style={s.errorText}>{errores.rfc}</span>}
                    </div>

                    <label style={s.label}>Nombre o Razón Social *</label>
                    <input name="nombre" placeholder="NOMBRE COMPLETO" style={s.input} value={form.nombre} onChange={handleChange} />

                    <div style={s.inputWrapper}>
                        <label style={s.label}>Código Postal Fiscal *</label>
                        <input name="cp" placeholder="00000" style={{...s.input, borderColor: errores.cp ? '#ff4d4d' : 'rgba(255,255,255,0.1)'}} value={form.cp} maxLength={5} onChange={handleChange} />
                        {errores.cp && <span style={s.errorText}>{errores.cp}</span>}
                    </div>

                    <label style={s.label}>Descripción del servicio *</label>
                    <input name="description" placeholder="Ej. Honorarios mes de Enero" style={s.input} value={form.descripcion} onChange={handleChange} />
                    
                    <label style={s.label}>Importe total ($) *</label>
                    <input name="importe" placeholder="0.00" type="number" step="0.01" style={s.input} value={form.importe} onChange={handleChange} onBlur={handleBlurImporte} />

                    <label style={s.label}>Configuración de IVA *</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setForm({...form, ivaTipo: "Mas IVA"})} style={{ ...s.ivaBtn, background: form.ivaTipo === "Mas IVA" ? 'linear-gradient(135deg, #4286f4 0%, #182848 100%)' : 'rgba(255,255,255,0.05)', color: form.ivaTipo === "Mas IVA" ? 'white' : 'rgba(255,255,255,0.4)' }}>+ IVA</button>
                        <button onClick={() => setForm({...form, ivaTipo: "IVA Incluido"})} style={{ ...s.ivaBtn, background: form.ivaTipo === "IVA Incluido" ? 'linear-gradient(135deg, #4286f4 0%, #182848 100%)' : 'rgba(255,255,255,0.05)', color: form.ivaTipo === "IVA Incluido" ? 'white' : 'rgba(255,255,255,0.4)' }}>IVA Incluido</button>
                    </div>

                    <label style={{...s.label, color: '#ffa726'}}>Notas adicionales</label>
                    <textarea 
                        name="notas" 
                        placeholder="Instrucciones especiales para el despacho..." 
                        style={s.textareaNotas} 
                        value={form.notas} 
                        onChange={handleChange} 
                    />

                    <div style={s.advertencia}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            {formularioValido ? <FaCheckCircle color="#4CAF50"/> : <FaExclamationTriangle color="#ffa726"/>}
                            <span style={{ ...s.labelCheck, color: formularioValido ? '#4CAF50' : '#ffa726', fontWeight: 'bold' }}>
                                {formularioValido ? "Datos completos" : "Faltan campos obligatorios"}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input type="checkbox" id="check" disabled={!formularioValido} checked={aceptoTerminos} onChange={() => setAceptoTerminos(!aceptoTerminos)} style={{cursor: 'pointer'}} />
                            <label htmlFor="check" style={s.labelCheck}>Confirmo que los datos son correctos.</label>
                        </div>
                    </div>

                    <button onClick={handleSubmit} disabled={!aceptoTerminos || enviando} style={{...s.mainBtn, background: (enviando || !aceptoTerminos) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', color: (enviando || !aceptoTerminos) ? 'rgba(255,255,255,0.3)' : 'white'}}>
                        {enviando ? "Procesando..." : "Enviar Solicitud"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const s = {
    mainContainer: { 
        height: '100vh', 
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Segoe UI, Roboto, sans-serif',
        overflow: 'hidden',
        position: 'relative'
    },
    decorCircle1: {
        position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
    },
    card: { 
        backgroundColor: 'rgba(15, 32, 39, 0.85)', 
        borderRadius: '30px', 
        width: '90%',
        maxWidth: '450px',
        height: '90vh',
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 1,
        overflow: 'hidden'
    },
    header: {
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
    btnBackIcon: { background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' },
    title: { color: 'white', fontSize: '18px', margin: 0, fontWeight: '700' },
    scrollArea: { padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
    instrucciones: { color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'center', marginBottom: '10px' },
    label: { fontSize: '10px', fontWeight: 'bold', color: '#4286f4', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { 
        padding: '12px', 
        borderRadius: '12px', 
        border: '1px solid rgba(255,255,255,0.1)', 
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: 'white',
        fontSize: '14px',
        outline: 'none'
    },
    select: { 
        padding: '12px', 
        borderRadius: '12px', 
        border: '1px solid rgba(255,255,255,0.1)', 
        backgroundColor: '#1a1a1a', // Fondo sólido para selects en dark mode
        color: 'white',
        fontSize: '13px',
        outline: 'none'
    },
    row: { display: 'flex', gap: '10px' },
    textareaNotas: { 
        padding: '12px', 
        borderRadius: '12px', 
        border: '1px dashed #ffa726', 
        backgroundColor: 'rgba(255,167,38,0.05)',   
        fontSize: '13px', 
        height: '80px',               
        color: 'white',
        outline: 'none',
        resize: 'none'
    },
    inputWrapper: { display: 'flex', flexDirection: 'column', gap: '4px' },
    errorText: { color: '#ff4d4d', fontSize: '10px', fontWeight: '600' },
    ivaBtn: { flex: 1, padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.3s' },
    mainBtn: { padding: '16px', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px' },
    advertencia: { background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' },
    labelCheck: { fontSize: '12px', color: 'rgba(255,255,255,0.7)' }
};

export default FacturacionScreen;