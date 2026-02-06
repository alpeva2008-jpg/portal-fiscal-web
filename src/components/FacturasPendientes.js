import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import emailjs from '@emailjs/browser';
import HistorialSolicitudes from './HistorialSolicitudes'; // Asegúrate de que el archivo exista en la misma carpeta

// --- LISTAS DE CATÁLOGOS INTEGRADAS ---
const listaRegimenes = [ { clave: "601", nombre: "Régimen General de Ley Personas Morales" }, { clave: "602", nombre: "Régimen Simplificado de Ley Personas Morales" }, { clave: "603", nombre: "Personas Morales con Fines No Lucrativos" }, { clave: "604", nombre: "Régimen de Pequeños Contribuyentes" }, { clave: "605", nombre: "Sueldos y Salarios e Ingresos Asimilados a Salarios" }, { clave: "606", nombre: "Arrendamiento" }, { clave: "607", nombre: "Enajenación o Adquisición de Bienes" }, { clave: "608", nombre: "Demás Ingresos" }, { clave: "609", nombre: "Consolidación" }, { clave: "610", nombre: "Residentes en el Extranjero sin EP en México" }, { clave: "611", nombre: "Ingresos por Dividendos" }, { clave: "612", nombre: "Actividades Empresariales y Profesionales" }, { clave: "613", nombre: "Régimen Intermedio PF" }, { clave: "614", nombre: "Ingresos por Intereses" }, { clave: "615", nombre: "Obtención de Premios" }, { clave: "616", nombre: "Sin Obligaciones Fiscales" }, { clave: "617", nombre: "PEMEX" }, { clave: "618", nombre: "Régimen Simplificado PF" }, { clave: "619", nombre: "Ingresos por Préstamos" }, { clave: "620", nombre: "Sociedades Cooperativas de Producción" }, { clave: "621", nombre: "Régimen de Incorporación Fiscal" }, { clave: "622", nombre: "Actividades Agrícolas PM" }, { clave: "623", nombre: "Opcional para Grupos de Sociedades" }, { clave: "624", nombre: "Coordinados" }, { clave: "625", nombre: "Plataformas Tecnológicas" }, { clave: "626", nombre: "Régimen Simplificado de Confianza" } ];
const listaUsosCFDI = [ { clave: "G01", descripcion: "Adquisición de mercancías" }, { clave: "G02", descripcion: "Devoluciones, descuentos o bonificaciones" }, { clave: "G03", descripcion: "Gastos en general" }, { clave: "I01", descripcion: "Construcciones" }, { clave: "I02", descripcion: "Mobiliario y equipo de oficina por inversiones" }, { clave: "I03", descripcion: "Equipo de transporte" }, { clave: "I04", descripcion: "Equipo de cómputo y accesorios" }, { clave: "I05", descripcion: "Dados, troqueles, moldes, matrices y herramental" }, { clave: "I06", descripcion: "Comunicaciones telefónicas" }, { clave: "I07", descripcion: "Comunicaciones satelitales" }, { clave: "I08", descripcion: "Otra maquinaria y equipo" }, { clave: "D01", descripcion: "Honorarios médicos" }, { clave: "D02", descripcion: "Gastos médicos por incapacidad" }, { clave: "D03", descripcion: "Gastos funerales" }, { clave: "D04", descripcion: "Donativos" }, { clave: "D05", descripcion: "Intereses hipotecarios" }, { clave: "D06", descripcion: "Aportaciones SAR" }, { clave: "D07", descripcion: "Seguros de gastos médicos" }, { clave: "D08", descripcion: "Transportación escolar" }, { clave: "D09", descripcion: "Depósitos para el ahorro" }, { clave: "D10", descripcion: "Colegaturas" }, { clave: "S01", descripcion: "Sin efectos fiscales" }, { clave: "CP01", descripcion: "Pagos" }, { clave: "CN01", descripcion: "Nómina" } ];
const listaFormasPago = [ { clave: "01", nombre: "Efectivo" }, { clave: "02", nombre: "Cheque nominativo" }, { clave: "03", nombre: "Transferencia electrónica de fondos" }, { clave: "04", nombre: "Tarjeta de crédito" }, { clave: "05", nombre: "Monedero electrónico" }, { clave: "06", nombre: "Dinero electrónico" }, { clave: "08", nombre: "Vales de despensa" }, { clave: "12", nombre: "Dación en pago" }, { clave: "13", nombre: "Pago por subrogación" }, { clave: "14", nombre: "Pago por consignación" }, { clave: "15", nombre: "Condonación" }, { clave: "17", nombre: "Compensación" }, { clave: "23", nombre: "Novación" }, { clave: "24", nombre: "Confusión" }, { clave: "25", nombre: "Remisión de deuda" }, { clave: "26", nombre: "Prescripción o caducidad" }, { clave: "27", nombre: "A satisfacción del acreedor" }, { clave: "28", nombre: "Tarjeta de débito" }, { clave: "29", nombre: "Tarjeta de servicios" }, { clave: "30", nombre: "Aplicación de anticipos" }, { clave: "99", nombre: "Por definir" } ];
const listaMetodosPago = [ { clave: "PUE", nombre: "Pago de Una Sola Exhibición" }, { clave: "PPD", nombre: "Pago en Parcialidades o Diferidos" } ];

const FacturasPendientes = ({ clienteId, nombreCliente, emailCliente, onBack }) => {
    const [facturas, setFacturas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [verHistorial, setVerHistorial] = useState(false);

    const SERVICE_ID = "service_4e756ev";
    const TEMPLATE_ID = "template_7n53wy4";
    const PUBLIC_KEY = "tKfQFx27GXLv2ohaH";

    useEffect(() => {
        if (!clienteId) return;

        const q = query(
            collection(db, "facturaciones", clienteId, "facturas"),
            where("estado", "==", "pendiente"),
            orderBy("fecha", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFacturas(docs);
            setCargando(false); 
        }, (error) => {
            console.error("Error al cargar facturas:", error);
            setCargando(false);
        });

        return () => unsubscribe();
    }, [clienteId]);

    if (verHistorial) {
        return <HistorialSolicitudes 
                    clienteId={clienteId} 
                    nombreCliente={nombreCliente} 
                    onBack={() => setVerHistorial(false)} 
                />;
    }

    const copiarAlPortapapeles = (texto) => {
        if (!texto) return;
        navigator.clipboard.writeText(texto);
    };

    const getNombreForma = (clave) => listaFormasPago.find(f => f.clave === clave)?.nombre || "No especificada";
    const getNombreMetodo = (clave) => listaMetodosPago.find(m => m.clave === clave)?.nombre || "No especificado";
    const getNombreUso = (clave) => listaUsosCFDI.find(u => u.clave === clave)?.descripcion || "No especificado";

    // --- FUNCIÓN INTEGRADA ---
    const handleCompletarFactura = async (facturaId) => {
        if (!window.confirm("¿Confirmas que ya has emitido esta factura?")) return;
        try {
            await updateDoc(doc(db, "facturaciones", clienteId, "facturas", facturaId), { 
                estado: "completada",
                fechaFinalizado: new Date().toLocaleString('es-MX')
            });

            // ACTUALIZACIÓN LOCAL: Filtramos la factura que ya no está pendiente
            setFacturas(prev => prev.filter(f => f.id !== facturaId));

            alert("✅ Factura marcada como completada.");
        } catch (error) { alert("Error: " + error.message); }
    };

    const handleRechazarFactura = async (factura) => {
        const motivo = window.prompt("Escribe el motivo del rechazo:");
        if (!motivo) return;
        try {
            await updateDoc(doc(db, "facturaciones", clienteId, "facturas", factura.id), { 
                estado: "rechazada",
                motivoRechazo: motivo,
                fechaRechazo: new Date().toLocaleString('es-MX')
            });
            
            // ACTUALIZACIÓN LOCAL: También limpiamos la pantalla al rechazar
            setFacturas(prev => prev.filter(f => f.id !== factura.id));

            const correoDestino = emailCliente || factura.email || factura.correoCliente; 
            if (correoDestino && correoDestino !== "No disponible") {
                const templateParams = {
                    nombre_cliente: nombreCliente,
                    email_cliente: correoDestino,   
                    asunto_personalizado: "SOLICITUD DE FACTURA RECHAZADA",
                    mensaje_principal: `Atención: Tu solicitud por "${factura.descripcion}" ha sido rechazada.`,
                    detalles: `Motivo: ${motivo}`
                };
                await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            }
            alert("❌ Factura rechazada.");
        } catch (error) { alert("Error: " + error.message); }
    };

    const BtnCopy = ({ texto, etiqueta }) => (
        <button onClick={() => copiarAlPortapapeles(texto)} title={`Copiar ${etiqueta}`} style={s.btnCopy}>📋 Copiar</button>
    );

    return (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '10px' }}>
                <button onClick={onBack} style={s.btnBackMini}>← Volver</button>
                <button onClick={() => setVerHistorial(true)} style={s.btnHistorial}>📜 Historial de Solicitudes</button>
            </div>

            <h2 style={{ margin: '0 0 20px 0', color: '#E91E63', fontSize: '22px' }}>Pendientes: {nombreCliente}</h2>

            {cargando ? <p style={{ textAlign: 'center' }}>Cargando...</p> : 
             facturas.length === 0 ? <div style={s.emptyState}><p>No hay facturas pendientes.</p></div> : (
                facturas.map((f) => (
                    <div key={f.id} style={s.card}>
                        <div style={s.cardHeader}>
                            <span style={s.fecha}>Solicitud: {f.fecha}</span>
                            <span style={s.badge}>PENDIENTE</span>
                        </div>
                        
                        <div style={s.sectionData}>
                            <div style={s.rowCopy}>
                                <p style={s.clienteNombre}><strong>{f.nombre}</strong></p>
                                <BtnCopy texto={f.nombre} etiqueta="Nombre" />
                            </div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                                <div style={s.rowCopy}><span style={s.datoPrincipal}><strong>RFC:</strong> {f.rfc}</span><BtnCopy texto={f.rfc} etiqueta="RFC" /></div>
                                <div style={s.rowCopy}><span style={s.datoPrincipal}><strong>CP:</strong> {f.cp}</span><BtnCopy texto={f.cp} etiqueta="CP" /></div>
                            </div>
                            <div style={{...s.rowCopy, marginTop: '8px'}}>
                                <span style={s.datoPrincipal}><strong>Régimen:</strong> {f.regimenClave} - {f.regimenNombre}</span>
                                <BtnCopy texto={f.regimenClave} etiqueta="Régimen" />
                            </div>
                        </div>

                        <hr style={s.divider} />

                        <div style={s.infoColumn}>
                            <div style={s.itemDetalle}>
                                <div style={s.rowCopy}><strong>Uso CFDI:</strong> <BtnCopy texto={f.usoClave} etiqueta="Uso" /></div>
                                <span style={s.datoDescripcion}>{f.usoClave} - {getNombreUso(f.usoClave)}</span>
                            </div>

                            <div style={s.itemDetalle}>
                                <div style={s.rowCopy}><strong>Método de Pago:</strong> <BtnCopy texto={f.metodoPago} etiqueta="Método" /></div>
                                <span style={s.datoDescripcion}>{f.metodoPago} - {getNombreMetodo(f.metodoPago)}</span>
                            </div>

                            <div style={s.itemDetalle}>
                                <div style={s.rowCopy}><strong>Forma de Pago:</strong> <BtnCopy texto={f.formaPago} etiqueta="Forma" /></div>
                                <span style={s.datoDescripcion}>{f.formaPago} - {getNombreForma(f.formaPago)}</span>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <p style={{ margin: 0, fontSize: '18px' }}><strong>Total:</strong> <span style={{color: '#2e7d32', fontWeight: '800'}}>${f.importe}</span> <span style={{fontSize: '14px', color: '#666'}}>({f.ivaTipo})</span></p>
                            <BtnCopy texto={f.importe} etiqueta="Importe" />
                        </div>

                        <div style={s.conceptosBox}>
                            <div style={s.rowCopy}><strong>Concepto:</strong> <BtnCopy texto={f.descripcion} etiqueta="Concepto" /></div>
                            <p style={{margin: '8px 0', fontSize: '16px', lineHeight: '1.4'}}>{f.descripcion}</p>
                        </div>

                        {f.notas && (
                            <div style={s.notasBox}>
                                <div style={s.rowCopy}><strong>📌 Notas del Cliente:</strong> <BtnCopy texto={f.notas} etiqueta="Notas" /></div>
                                <p style={{margin: '8px 0', fontStyle: 'italic', fontSize: '15px'}}>{f.notas}</p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button onClick={() => handleCompletarFactura(f.id)} style={{ ...s.btnBase, backgroundColor: '#4CAF50' }}>✅ Facturar</button>
                            <button onClick={() => handleRechazarFactura(f)} style={{ ...s.btnBase, backgroundColor: '#f44336' }}>❌ Rechazar</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const s = {
    btnBackMini: { padding: '10px 16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    btnHistorial: { padding: '10px 16px', backgroundColor: '#3f51b5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    emptyState: { textAlign: 'center', padding: '60px', backgroundColor: '#f8f9fa', borderRadius: '15px', color: '#888' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '25px', marginBottom: '25px', boxShadow: '0 6px 15px rgba(0,0,0,0.1)', borderLeft: '8px solid #E91E63' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' },
    fecha: { fontSize: '13px', color: '#777' },
    badge: { fontSize: '11px', backgroundColor: '#fff0f3', color: '#E91E63', padding: '4px 12px', borderRadius: '20px', fontWeight: '800' },
    sectionData: { marginBottom: '15px' },
    clienteNombre: { margin: '0', fontSize: '20px', color: '#1a1a1a', textTransform: 'uppercase' },
    datoPrincipal: { margin: '0', fontSize: '16px', color: '#333' },
    datoDescripcion: { margin: '4px 0 0 0', fontSize: '15px', color: '#555' },
    rowCopy: { display: 'flex', alignItems: 'center', gap: '10px' },
    btnCopy: { padding: '5px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #d1d1d1', borderRadius: '6px', color: '#555', fontWeight: '600' },
    divider: { border: '0', borderTop: '2px solid #f0f0f0', margin: '15px 0' },
    infoColumn: { display: 'flex', flexDirection: 'column', gap: '12px' },
    itemDetalle: { display: 'flex', flexDirection: 'column' },
    conceptosBox: { marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#333', border: '1px solid #e2e8f0' },
    notasBox: { marginTop: '15px', padding: '15px', backgroundColor: '#fff9c4', borderRadius: '10px', color: '#333', border: '1px dashed #ffb300' },
    btnBase: { flex: 1, padding: '14px', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }
};

export default FacturasPendientes;