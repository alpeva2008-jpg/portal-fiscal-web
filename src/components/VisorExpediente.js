import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";
import emailjs from '@emailjs/browser';

const SERVICE_ID = "service_4e756ev";
const TEMPLATE_ID = "template_7n53wy4";
const PUBLIC_KEY = "tKfQFx27GXLv2ohaH";
const API_KEY = "AIzaSyBWM8bOjfWnZw3plkmrEUQXDfxQejSJIEE"; 

const VisorExpediente = ({ clienteId, nombreCliente, onBack }) => {
    const [tipoDoc, setTipoDoc] = useState("facturas");
    const [folderId, setFolderId] = useState("");
    const [clienteEmail, setClienteEmail] = useState(""); 
    const [docsExistentes, setDocsExistentes] = useState([]);
    const [docsEnDrive, setDocsEnDrive] = useState([]); 
    const [cargando, setCargando] = useState(false);
    const [escaneando, setEscaneando] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!clienteId) return;
            
            const userDoc = await getDoc(doc(db, "usuarios", clienteId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setFolderId(data.driveFolderId || ""); 
                setClienteEmail(data.email || ""); 
            }

            const q = query(collection(db, tipoDoc), where("userId", "==", clienteId));
            const querySnapshot = await getDocs(q);
            setDocsExistentes(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchData();
    }, [clienteId, tipoDoc]);

    const handleSaveDriveId = async () => {
        if (!folderId) return alert("Escribe un ID de carpeta válido");
        try {
            await updateDoc(doc(db, "usuarios", clienteId), { driveFolderId: folderId });
            alert("✅ ID de carpeta vinculado a este cliente");
        } catch (e) { alert("Error: " + e.message); }
    };

    const handleEscanearDrive = async () => {
        if (!folderId) return alert("Primero guarda un ID de carpeta");
        setEscaneando(true);
        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,webViewLink)&key=${API_KEY}`
            );
            const data = await response.json();
            if (data.files) {
                setDocsEnDrive(data.files);
            } else {
                alert("No se encontraron archivos. Verifica que la carpeta sea pública.");
            }
        } catch (error) {
            alert("Error al conectar con Drive.");
        }
        setEscaneando(false);
    };

    const handlePublicarDoc = async (file) => {
        if (!clienteEmail) return alert("El cliente no tiene correo registrado.");

        setCargando(true);
        try {
            const objetoDoc = { 
                userId: clienteId, 
                nombre: file.name, 
                fecha: new Date().toLocaleDateString(), 
                timestamp: Date.now(),
                url: file.webViewLink, 
                driveId: file.id,
                visto: false 
            };
            
            await addDoc(collection(db, tipoDoc), objetoDoc);

            // --- CAMBIO INTEGRADO AQUÍ ---
            const templateParams = {
                nombre_cliente: nombreCliente,
                email_cliente: clienteEmail,
                asunto_personalizado: "Nuevo documento disponible", 
                mensaje_principal: `Se ha publicado un nuevo archivo en tu sección de ${tipoDoc.toUpperCase()}.`,
                detalles: `Archivo: ${file.name}`
            };

            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            // -----------------------------
            
            alert(`¡${file.name} publicado con éxito!`);
            
            setDocsExistentes([...docsExistentes, objetoDoc]);
            setDocsEnDrive(docsEnDrive.filter(f => f.id !== file.id));
        } catch (e) {
            alert("Error: " + e.message);
        }
        setCargando(false);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Eliminar este documento del portal?")) return;
        try {
            await deleteDoc(doc(db, tipoDoc, id));
            setDocsExistentes(docsExistentes.filter(d => d.id !== id));
        } catch (e) { alert("Error al eliminar"); }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <button onClick={onBack} style={s.btnBack}>← Volver al Panel</button>
            
            <h2 style={{textAlign: 'center', color: '#333'}}>Gestor de Archivos (Drive)</h2>
            <p style={{textAlign: 'center', color: '#666'}}>Cliente: <strong>{nombreCliente}</strong></p>

            <div style={{...s.section, borderLeft: '5px solid #FFC107'}}>
                <h3 style={s.sectionTitle}>📁 1. Configurar Carpeta del Cliente</h3>
                <p style={s.label}>Pega aquí el ID de la carpeta de Google Drive exclusiva para este cliente:</p>
                <div style={{display: 'flex', gap: '10px'}}>
                    <input 
                        placeholder="ID de la carpeta de Drive..." 
                        style={{...s.input, flex: 1}} 
                        value={folderId} 
                        onChange={e => setFolderId(e.target.value)} 
                    />
                    <button onClick={handleSaveDriveId} style={s.btnAzul}>Vincular</button>
                </div>
                <button onClick={handleEscanearDrive} disabled={escaneando} style={s.btnEscanear}>
                    {escaneando ? "Buscando archivos..." : "🔍 Buscar archivos nuevos en Drive"}
                </button>
            </div>

            {docsEnDrive.length > 0 && (
                <div style={{...s.section, borderLeft: '5px solid #2196F3'}}>
                    <h3 style={s.sectionTitle}>📥 2. Archivos en Drive (Sin publicar)</h3>
                    <select style={s.input} value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                        <option value="facturas">Categoría: Facturas</option>
                        <option value="declaraciones">Categoría: Declaraciones</option>
                        <option value="constancia">Categoría: Constancia</option>
                        <option value="opinion32d">Categoría: Opinión 32D</option>
                    </select>

                    <div style={{marginTop: '10px'}}>
                        {docsEnDrive.map(file => (
                            <div key={file.id} style={s.rowDrive}>
                                <span style={{fontSize: '13px'}}>{file.name}</span>
                                <button onClick={() => handlePublicarDoc(file)} disabled={cargando} style={s.btnPublicar}>
                                    {cargando ? "Cargando..." : "Publicar y Avisar"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{...s.section, borderLeft: '5px solid #4CAF50'}}>
                <h3 style={s.sectionTitle}>✅ Archivos visibles en {tipoDoc.toUpperCase()}</h3>
                {docsExistentes.length === 0 ? (
                    <p style={s.label}>No hay archivos publicados en esta categoría.</p>
                ) : (
                    docsExistentes.map(doc => (
                        <div key={doc.id} style={s.rowEliminar}>
                            <span style={{fontSize: '13px'}}>{doc.nombre}</span>
                            <button onClick={() => handleEliminar(doc.id)} style={s.btnEliminar}>Quitar</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const s = {
    section: { backgroundColor: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    sectionTitle: { margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold', color: '#444' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
    btnAzul: { padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnEscanear: { padding: '12px', backgroundColor: '#673ab7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' },
    btnPublicar: { backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
    rowDrive: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '5px', border: '1px solid #eee' },
    btnBack: { padding: '8px 15px', backgroundColor: '#eee', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '10px' },
    rowEliminar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f5f5f5' },
    btnEliminar: { backgroundColor: '#f44336', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
    label: { fontSize: '12px', color: '#888', marginBottom: '5px' }
};

export default VisorExpediente;