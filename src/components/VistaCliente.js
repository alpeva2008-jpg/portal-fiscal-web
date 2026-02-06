import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { FaDownload, FaRegFileAlt, FaArrowLeft } from 'react-icons/fa';

const VistaCliente = ({ userId, seccion, onBack }) => {
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);

    const nombresSecciones = {
        facturas: "Mis Facturas",
        declaraciones: "Mis Declaraciones",
        constancia: "Mi Constancia Fiscal",
        opinion32d: "Mi Opinión 32D"
    };

    const handleVerArchivo = async (documento) => {
        const urlDirecta = documento.url.replace('/view?usp=drivesdk', '/preview').replace('/view', '/preview');
        window.open(urlDirecta, '_blank');

        if (!documento.visto) {
            try {
                const docRef = doc(db, seccion, documento.id);
                await updateDoc(docRef, { visto: true });
                setDocumentos(prev => prev.map(d => d.id === documento.id ? { ...d, visto: true } : d));
            } catch (e) {
                console.error("Error al marcar como visto:", e);
            }
        }
    };

    useEffect(() => {
        const cargarDocumentos = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const q = query(
                    collection(db, seccion), 
                    where("userId", "==", userId) 
                );
                
                const querySnapshot = await getDocs(q);
                const listaDocs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setDocumentos(listaDocs);
            } catch (error) {
                console.error("Error de seguridad o lectura:", error);
            }
            setLoading(false);
        };

        cargarDocumentos();
    }, [userId, seccion]);

    return (
        <div style={s.container}>
            {/* ELEMENTOS DE FONDO */}
            <div style={s.decorCircle1}></div>
            <div style={s.decorCircle2}></div>

            <div style={s.contentWrapper}>
                <button onClick={onBack} style={s.btnBack}>
                    <FaArrowLeft /> Volver al Menú
                </button>
                
                <h2 style={s.titulo}>{nombresSecciones[seccion] || seccion.toUpperCase()}</h2>

                {loading ? (
                    <div style={s.loader}>Buscando tus archivos...</div>
                ) : (
                    <div style={s.lista}>
                        {documentos.length === 0 ? (
                            <div style={s.vacio}>
                                <p>No se encontraron archivos en esta sección.</p>
                            </div>
                        ) : (
                            documentos.map((doc) => (
                                <div key={doc.id} style={s.card}>
                                    <div style={s.info}>
                                        <FaRegFileAlt size={22} color="#4286f4" />
                                        <div>
                                            <p style={s.nombreDoc}>
                                                {doc.nombre} 
                                                {doc.visto === false ? " 🔴" : " 🔵"}
                                            </p>
                                            <p style={s.fechaDoc}>{doc.fecha}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleVerArchivo(doc)} 
                                        style={s.btnDescarga}
                                    >
                                        <FaDownload /> Ver
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const s = {
    container: { 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        fontFamily: 'Segoe UI, Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px'
    },
    decorCircle1: {
        position: 'absolute', top: '-5%', left: '-5%', width: '350px', height: '350px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
    },
    decorCircle2: {
        position: 'absolute', bottom: '-5%', right: '-5%', width: '250px', height: '250px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
    },
    contentWrapper: {
        position: 'relative',
        zIndex: 1,
        maxWidth: '550px',
        margin: '0 auto'
    },
    btnBack: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '10px 0', 
        border: 'none', 
        backgroundColor: 'transparent', 
        cursor: 'pointer', 
        color: 'rgba(255,255,255,0.6)', 
        fontWeight: 'bold',
        fontSize: '14px'
    },
    titulo: { 
        textAlign: 'center', 
        color: '#ffffff', 
        margin: '20px 0 30px 0', 
        fontSize: '24px',
        fontWeight: '700',
        letterSpacing: '0.5px'
    },
    lista: { display: 'flex', flexDirection: 'column', gap: '15px' },
    card: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '18px', 
        backgroundColor: 'rgba(15, 32, 39, 0.8)', 
        backdropFilter: 'blur(15px)',
        borderRadius: '20px', 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
    },
    info: { display: 'flex', alignItems: 'center', gap: '15px' },
    nombreDoc: { fontWeight: '600', fontSize: '15px', color: '#ffffff', margin: 0 },
    fechaDoc: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' },
    btnDescarga: { 
        border: 'none', 
        background: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)', 
        color: 'white', 
        padding: '10px 18px', 
        borderRadius: '12px', 
        fontSize: '13px', 
        fontWeight: 'bold', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
    },
    loader: { textAlign: 'center', marginTop: '60px', color: '#ffffff', fontWeight: '500' },
    vacio: { 
        textAlign: 'center', 
        marginTop: '60px', 
        color: 'rgba(255,255,255,0.4)', 
        fontStyle: 'italic',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: '30px',
        borderRadius: '20px'
    }
};

export default VistaCliente;