import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import AuditoriaXML from './AuditoriaXML'; 

const AdminScreen = ({ onBack }) => {
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [selectedCliente, setSelectedCliente] = useState("");
    const [docsExistentes, setDocsExistentes] = useState([]);
    
    // NUEVO ESTADO PARA NAVEGACIÓN
    const [mostrarAuditoria, setMostrarAuditoria] = useState(false);
    
    const [tipoDoc, setTipoDoc] = useState("facturas");
    const [nombreDoc, setNombreDoc] = useState("");
    const [urlDrive, setUrlDrive] = useState("");
    const [urlXml, setUrlXml] = useState("");
    
    const [pago, setPago] = useState({
        banco: "", beneficiario: "", clabe: "", concepto: "", importe: "", diaCorte: "", pagado: false
    });

    const [modulos, setModulos] = useState({
        facturas: true, declaraciones: true, constancia: true, opinion32d: true, facturacion: true, honorarios: true
    });

    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const fetchClientes = async () => {
            const querySnapshot = await getDocs(collection(db, "usuarios"));
            setClientes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchClientes();
    }, []);

    useEffect(() => {
        if (selectedCliente) {
            const cliente = clientes.find(c => c.id === selectedCliente);
            if (cliente && cliente.datosPago) {
                setPago(cliente.datosPago);
            } else {
                setPago({ banco: "", beneficiario: "", clabe: "", concepto: "", importe: "", diaCorte: "", pagado: false });
            }
            if (cliente && cliente.modulosActivos) {
                setModulos(cliente.modulosActivos);
            } else {
                setModulos({ facturas: true, declaraciones: true, constancia: true, opinion32d: true, facturacion: true, honorarios: true });
            }
        }
    }, [selectedCliente, clientes]);

    useEffect(() => {
        const fetchDocs = async () => {
            if (selectedCliente) {
                const q = query(collection(db, tipoDoc), where("userId", "==", selectedCliente));
                const querySnapshot = await getDocs(q);
                setDocsExistentes(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                setDocsExistentes([]);
            }
        };
        fetchDocs();
    }, [selectedCliente, tipoDoc]);

    const handleSubirDoc = async () => {
        if (!selectedCliente || !nombreDoc || !urlDrive) return alert("Llena los campos del documento");
        setCargando(true);
        try {
            let objetoDoc = { userId: selectedCliente, name: nombreDoc, fecha: new Date().toLocaleDateString(), timestamp: Date.now() };
            if (tipoDoc === "pdfs") objetoDoc.url = urlDrive;
            else objetoDoc.pdfUrl = urlDrive;
            if (tipoDoc === "facturas" && urlXml) objetoDoc.xmlUrl = urlXml;
            await addDoc(collection(db, tipoDoc), objetoDoc);
            alert("¡Documento vinculado!");
            setNombreDoc(""); setUrlDrive(""); setUrlXml("");
            const q = query(collection(db, tipoDoc), where("userId", "==", selectedCliente));
            const querySnapshot = await getDocs(q);
            setDocsExistentes(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { alert("Error: " + e.message); }
        setCargando(false);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este documento?")) return;
        try {
            await deleteDoc(doc(db, tipoDoc, id));
            setDocsExistentes(docsExistentes.filter(d => d.id !== id));
            alert("Documento eliminado correctamente");
        } catch (e) { alert("Error al eliminar"); }
    };

    const handleActualizarPago = async () => {
        if (!selectedCliente) return alert("Selecciona un cliente");
        setCargando(true);
        try {
            const userRef = doc(db, "usuarios", selectedCliente);
            await updateDoc(userRef, { datosPago: pago, ultimoUpdate: new Date().toLocaleDateString() });
            alert("¡Ficha de pago actualizada!");
            setClientes(clientes.map(c => c.id === selectedCliente ? { ...c, datosPago: pago } : c));
        } catch (e) { alert("Error: " + e.message); }
        setCargando(false);
    };

    const handleActualizarModulos = async () => {
        if (!selectedCliente) return alert("Selecciona un cliente");
        setCargando(true);
        try {
            const userRef = doc(db, "usuarios", selectedCliente);
            await updateDoc(userRef, { modulosActivos: modulos });
            alert("✅ Menú del cliente actualizado");
            setClientes(clientes.map(c => c.id === selectedCliente ? { ...c, modulosActivos: modulos } : c));
        } catch (e) { alert("Error: " + e.message); }
        setCargando(false);
    };

    const toggleEstadoPago = async (nuevoEstado) => {
        if (!selectedCliente) return alert("Selecciona un cliente");
        setCargando(true);
        try {
            const userRef = doc(db, "usuarios", selectedCliente);
            await updateDoc(userRef, { "datosPago.pagado": nuevoEstado });
            setPago(prev => ({ ...prev, pagado: nuevoEstado }));
            setClientes(clientes.map(c => c.id === selectedCliente ? { ...c, datosPago: { ...c.datosPago, pagado: nuevoEstado } } : c));
            alert(nuevoEstado ? "✅ Marcado como PAGADO" : "⏳ Marcado como PENDIENTE");
        } catch (e) { alert("Error: " + e.message); }
        setCargando(false);
    };

    const handleReiniciarNuevoMes = async () => {
        if (!selectedCliente) return alert("Selecciona un cliente");
        if (!window.confirm("¿Deseas limpiar la deuda anterior y preparar el cobro del NUEVO MES?")) return;
        setCargando(true);
        try {
            const userRef = doc(db, "usuarios", selectedCliente);
            const nuevosDatos = { ...pago, pagado: false, concepto: "HONORARIOS MES EN CURSO" };
            await updateDoc(userRef, { datosPago: nuevosDatos });
            setPago(nuevosDatos);
            setClientes(clientes.map(c => c.id === selectedCliente ? { ...c, datosPago: nuevosDatos } : c));
            alert("✨ ¡Cuenta reiniciada!");
        } catch (e) { alert("Error: " + e.message); }
        setCargando(false);
    };

    const clientesFiltrados = clientes.filter(c => 
        c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
        c.rfc?.toLowerCase().includes(busqueda.toLowerCase())
    );

    // LÓGICA DE NAVEGACIÓN RETORNO
    if (mostrarAuditoria) {
        return <AuditoriaXML 
                    rfcCliente={clientes.find(c => c.id === selectedCliente)?.rfc} 
                    onBack={() => setMostrarAuditoria(false)} 
                />;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2 style={{textAlign: 'center', color: '#333'}}>Panel de Control Fiscal</h2>
            
            <div style={s.section}>
                <h3 style={s.sectionTitle}>1. Seleccionar Cliente</h3>
                <input placeholder="🔍 Buscar por nombre o RFC..." style={{...s.input, marginBottom: '10px', backgroundColor: '#f0f8ff'}} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                <select style={s.input} value={selectedCliente} onChange={(e) => setSelectedCliente(e.target.value)}>
                    <option value="">-- Elegir Cliente ({clientesFiltrados.length}) --</option>
                    {clientesFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.rfc})</option>)}
                </select>
                
                {/* BOTÓN ADMINISTRADOR XML */}
                {selectedCliente && (
                    <button 
                        onClick={() => setMostrarAuditoria(true)} 
                        style={{...s.btnAzul, backgroundColor: '#FF5722', marginTop: '10px'}}
                    >
                        📂 ADMINISTRADOR DE XML
                    </button>
                )}
            </div>

            <div style={{...s.section, borderLeft: '5px solid #9C27B0'}}>
                <h3 style={s.sectionTitle}>2. Módulos Visibles para el Cliente</h3>
                <p style={s.label}>Marca solo lo que el cliente debe ver en su menú:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                    {Object.keys(modulos).map((key) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={modulos[key]} onChange={(e) => setModulos({ ...modulos, [key]: e.target.checked })} />
                            {key.toUpperCase()}
                        </label>
                    ))}
                </div>
                <button onClick={handleActualizarModulos} disabled={cargando} style={{...s.btnAzul, backgroundColor: '#9C27B0', marginTop: '10px'}}>Actualizar Menú Cliente</button>
            </div>

            <div style={{...s.section, borderLeft: '5px solid #4CAF50'}}>
                <h3 style={s.sectionTitle}>3. Vincular Archivos</h3>
                <select style={s.input} value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                    <option value="facturas">Facturas (PDF y XML)</option>
                    <option value="pdfs">Declaraciones</option>
                    <option value="csf">Constancia (CSF)</option>
                    <option value="opinion32d">Opinión 32D</option>
                </select>
                <input placeholder="Nombre (Ej: Pago Enero)" style={s.input} value={nombreDoc} onChange={e => setNombreDoc(e.target.value)} />
                <input placeholder="Link PDF" style={s.input} value={urlDrive} onChange={e => setUrlDrive(e.target.value)} />
                {tipoDoc === "facturas" && <input placeholder="Link XML" style={s.input} value={urlXml} onChange={e => setUrlXml(e.target.value)} />}
                <button onClick={handleSubirDoc} disabled={cargando} style={s.btnVerde}>{cargando ? "Vinculando..." : "Vincular Documento"}</button>
            </div>

            <div style={{...s.section, borderLeft: '5px solid #f44336'}}>
                <h3 style={s.sectionTitle}>4. Gestionar / Eliminar Archivos</h3>
                {docsExistentes.length === 0 ? <p style={s.label}>No hay documentos.</p> : docsExistentes.map(doc => (
                    <div key={doc.id} style={s.rowEliminar}>
                        <span>{doc.name}</span>
                        <button onClick={() => handleEliminar(doc.id)} style={s.btnEliminar}>Eliminar</button>
                    </div>
                ))}
            </div>

            <div style={{...s.section, borderLeft: '5px solid #2196F3'}}>
                <h3 style={s.sectionTitle}>5. Datos Bancarios y Estado</h3>
                <input placeholder="Banco" style={s.input} value={pago.banco} onChange={e => setPago({...pago, banco: e.target.value})} />
                <input placeholder="Beneficiario" style={s.input} value={pago.beneficiario} onChange={e => setPago({...pago, beneficiario: e.target.value})} />
                <input placeholder="CLABE" style={s.input} value={pago.clabe} onChange={e => setPago({...pago, clabe: e.target.value})} />
                <input placeholder="Concepto" style={s.input} value={pago.concepto} onChange={e => setPago({...pago, concepto: e.target.value})} />
                <input type="number" placeholder="Importe ($)" style={s.input} value={pago.importe} onChange={e => setPago({...pago, importe: e.target.value})} />
                <input type="number" placeholder="Día de corte (Ej: 12)" style={s.input} value={pago.diaCorte} onChange={e => setPago({...pago, diaCorte: e.target.value})} />
                <button onClick={handleActualizarPago} disabled={cargando} style={s.btnAzul}>Actualizar Ficha</button>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px'}}>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={() => toggleEstadoPago(true)} style={{...s.btnVerde, flex: 1, padding: '10px'}}>MARCAR PAGADO</button>
                        <button onClick={() => toggleEstadoPago(false)} style={{...s.btnBack, flex: 1, color: '#f44336', padding: '10px', border: '1px solid #ddd'}}>REINICIAR PAGO</button>
                    </div>
                    <button onClick={handleReiniciarNuevoMes} disabled={cargando} style={s.btnNaranja}>🔄 REINICIAR PARA NUEVO MES (Quitar Mora)</button>
                </div>
                <p style={{textAlign: 'center', fontSize: '11px', color: pago.pagado ? '#4CAF50' : '#f44336', margin: '5px 0'}}>
                    Estado actual: {pago.pagado ? '✅ PAGADO (Check verde)' : '⏳ PENDIENTE (Mora activa si aplica)'}
                </p>
            </div>

            <button onClick={onBack} style={{...s.btnBack, marginTop: '10px'}}>← Volver al Menú</button>
        </div>
    );
};

const s = {
    section: { backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    sectionTitle: { margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold', color: '#555' },
    label: { fontSize: '12px', color: '#888' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #eee', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    btnVerde: { padding: '14px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnAzul: { padding: '14px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnNaranja: { padding: '12px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
    btnBack: { width: '100%', padding: '12px', backgroundColor: '#f5f5f5', color: '#666', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    rowEliminar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f9f9f9' },
    btnEliminar: { backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }
};

export default AdminScreen;