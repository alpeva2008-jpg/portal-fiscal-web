import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from "firebase/firestore";

// Listas para decodificar nombres (Igual que en pendientes)
const listaUsosCFDI = [ { clave: "G01", descripcion: "Adquisición de mercancías" }, { clave: "G02", descripcion: "Devoluciones, descuentos o bonificaciones" }, { clave: "G03", descripcion: "Gastos en general" }, { clave: "I01", descripcion: "Construcciones" }, { clave: "I02", descripcion: "Mobiliario y equipo de oficina por inversiones" }, { clave: "I03", descripcion: "Equipo de transporte" }, { clave: "I04", descripcion: "Equipo de cómputo y accesorios" }, { clave: "I05", descripcion: "Dados, troqueles, moldes, matrices y herramental" }, { clave: "I06", descripcion: "Comunicaciones telefónicas" }, { clave: "I07", descripcion: "Comunicaciones satelitales" }, { clave: "I08", descripcion: "Otra maquinaria y equipo" }, { clave: "D01", descripcion: "Honorarios médicos" }, { clave: "D02", descripcion: "Gastos médicos por incapacidad" }, { clave: "D03", descripcion: "Gastos funerales" }, { clave: "D04", descripcion: "Donativos" }, { clave: "D05", descripcion: "Intereses hipotecarios" }, { clave: "D06", descripcion: "Aportaciones SAR" }, { clave: "D07", descripcion: "Seguros de gastos médicos" }, { clave: "D08", descripcion: "Transportación escolar" }, { clave: "D09", descripcion: "Depósitos para el ahorro" }, { clave: "D10", descripcion: "Colegaturas" }, { clave: "S01", descripcion: "Sin efectos fiscales" }, { clave: "CP01", descripcion: "Pagos" }, { clave: "CN01", descripcion: "Nómina" } ];
const listaFormasPago = [ { clave: "01", nombre: "Efectivo" }, { clave: "02", nombre: "Cheque nominativo" }, { clave: "03", nombre: "Transferencia electrónica de fondos" }, { clave: "04", nombre: "Tarjeta de crédito" }, { clave: "05", nombre: "Monedero electrónico" }, { clave: "06", nombre: "Dinero electrónico" }, { clave: "08", nombre: "Vales de despensa" }, { clave: "12", nombre: "Dación en pago" }, { clave: "13", nombre: "Pago por subrogación" }, { clave: "14", nombre: "Pago por consignación" }, { clave: "15", nombre: "Condonación" }, { clave: "17", nombre: "Compensación" }, { clave: "23", nombre: "Novación" }, { clave: "24", nombre: "Confusión" }, { clave: "25", nombre: "Remisión de deuda" }, { clave: "26", nombre: "Prescripción o caducidad" }, { clave: "27", nombre: "A satisfacción del acreedor" }, { clave: "28", nombre: "Tarjeta de débito" }, { clave: "29", nombre: "Tarjeta de servicios" }, { clave: "30", nombre: "Aplicación de anticipos" }, { clave: "99", nombre: "Por definir" } ];
const listaMetodosPago = [ { clave: "PUE", nombre: "Pago de Una Sola Exhibición" }, { clave: "PPD", nombre: "Pago en Parcialidades o Diferidos" } ];

const HistorialSolicitudes = ({ clienteId, nombreCliente, onBack }) => {
    const [historial, setHistorial] = useState([]);
    const [cargando, setCargando] = useState(true);

    const getNombreForma = (clave) => listaFormasPago.find(f => f.clave === clave)?.nombre || "No especificada";
    const getNombreMetodo = (clave) => listaMetodosPago.find(m => m.clave === clave)?.nombre || "No especificado";
    const getNombreUso = (clave) => listaUsosCFDI.find(u => u.clave === clave)?.descripcion || "No especificado";

    useEffect(() => {
        if (!clienteId) return;

        const q = query(
            collection(db, "facturaciones", clienteId, "facturas"),
            where("estado", "!=", "pendiente")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // ORDENAMIENTO FORZADO POR TIEMPO ABSOLUTO CON LIMPIEZA DE TEXTO
            const historialOrdenado = docs.sort((a, b) => {
                // Función interna para normalizar el formato "p.m." de tus strings
                const limpiarFecha = (str) => {
                    if (!str) return 0;
                    // Quitamos los puntos de a.m. / p.m. y pasamos a Mayúsculas (ej: "4:49 PM")
                    const limpio = str.replace(/\./g, '').toUpperCase();
                    const fechaObj = new Date(limpio);
                    return fechaObj.getTime();
                };

                const tiempoA = limpiarFecha(a.fechaFinalizado || a.fechaRechazo);
                const tiempoB = limpiarFecha(b.fechaFinalizado || b.fechaRechazo);

                // Manejo de seguridad para fechas que no se pudieron parsear
                const valA = isNaN(tiempoA) ? 0 : tiempoA;
                const valB = isNaN(tiempoB) ? 0 : tiempoB;

                // TRUCO DE DESEMPATE: Si el tiempo es idéntico, ordenamos por ID
                // Esto rompe la agrupación por "estado" que Firestore envía por defecto
                if (valB === valA) {
                    return b.id.localeCompare(a.id);
                }

                return valB - valA; // De la más reciente a la más antigua
            });

            setHistorial(historialOrdenado);
            setCargando(false);
        });
        return () => unsubscribe();
    }, [clienteId]);

    return (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
                <button onClick={onBack} style={s.btnBackMini}>← Volver</button>
                <h2 style={{ margin: 0, color: '#333', fontSize: '22px' }}>Historial: {nombreCliente}</h2>
            </div>

            {cargando ? <p style={{ textAlign: 'center' }}>Cargando historial...</p> : 
             historial.length === 0 ? (
                <div style={s.emptyState}><p>No hay historial registrado.</p></div>
            ) : (
                historial.map((f) => (
                    <div key={f.id} style={{ 
                        ...s.card, 
                        borderLeft: f.estado === 'completada' ? '8px solid #4CAF50' : '8px solid #f44336' 
                    }}>
                        <div style={s.cardHeader}>
                            <span style={s.fecha}>Solicitado: {f.fecha}</span>
                            <span style={{ 
                                ...s.badge, 
                                backgroundColor: f.estado === 'completada' ? '#e8f5e9' : '#ffebee',
                                color: f.estado === 'completada' ? '#2e7d32' : '#c62828'
                            }}>
                                {f.estado.toUpperCase()}
                            </span>
                        </div>

                        <div style={s.sectionData}>
                            <p style={s.clienteNombre}><strong>{f.nombre}</strong></p>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                                <span style={s.datoPrincipal}><strong>RFC:</strong> {f.rfc}</span>
                                <span style={s.datoPrincipal}><strong>CP:</strong> {f.cp}</span>
                            </div>
                            <p style={{...s.datoPrincipal, marginTop: '8px'}}>
                                <strong>Régimen:</strong> {f.regimenClave} - {f.regimenNombre}
                            </p>
                        </div>

                        <hr style={s.divider} />

                        <div style={s.infoColumn}>
                            <p style={s.datoDescripcion}><strong>Uso CFDI:</strong> {f.usoClave} - {getNombreUso(f.usoClave)}</p>
                            <p style={s.datoDescripcion}><strong>Método:</strong> {f.metodoPago} - {getNombreMetodo(f.metodoPago)}</p>
                            <p style={s.datoDescripcion}><strong>Forma:</strong> {f.formaPago} - {getNombreForma(f.formaPago)}</p>
                        </div>
                        
                        <p style={{ marginTop: '15px', fontSize: '18px' }}>
                            <strong>Total:</strong> <span style={{color: '#2e7d32', fontWeight: '800'}}>${f.importe}</span> 
                            <span style={{fontSize: '14px', color: '#666'}}> ({f.ivaTipo})</span>
                        </p>

                        <div style={s.conceptosBox}>
                            <strong>Concepto:</strong>
                            <p style={{margin: '5px 0', fontSize: '15px'}}>{f.descripcion}</p>
                        </div>

                        <div style={{ 
                            marginTop: '15px', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            backgroundColor: f.estado === 'completada' ? '#f1f8e9' : '#fff4f4' 
                        }}>
                            {f.estado === 'completada' ? (
                                <p style={{ margin: 0, color: '#2e7d32', fontSize: '14px' }}>
                                    <strong>✅ Finalizado el:</strong> {f.fechaFinalizado}
                                </p>
                            ) : (
                                <div>
                                    <p style={{ margin: 0, color: '#c62828', fontSize: '14px' }}>
                                        <strong>❌ Rechazado el:</strong> {f.fechaRechazo}
                                    </p>
                                    <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '14px', fontStyle: 'italic' }}>
                                        <strong>Motivo:</strong> {f.motivoRechazo}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const s = {
    btnBackMini: { padding: '10px 16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    emptyState: { textAlign: 'center', padding: '60px', backgroundColor: '#f8f9fa', borderRadius: '15px', color: '#888' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' },
    fecha: { fontSize: '12px', color: '#777' },
    badge: { fontSize: '10px', padding: '4px 10px', borderRadius: '12px', fontWeight: '800' },
    sectionData: { marginBottom: '10px' },
    clienteNombre: { margin: '0', fontSize: '18px', color: '#1a1a1a', textTransform: 'uppercase' },
    datoPrincipal: { margin: '0', fontSize: '15px', color: '#333' },
    datoDescripcion: { margin: '2px 0', fontSize: '14px', color: '#555' },
    divider: { border: '0', borderTop: '1px solid #eee', margin: '12px 0' },
    infoColumn: { display: 'flex', flexDirection: 'column', gap: '4px' },
    conceptosBox: { marginTop: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }
};

export default HistorialSolicitudes;