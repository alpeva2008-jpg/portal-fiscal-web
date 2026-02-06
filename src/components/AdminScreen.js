import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";
import AuditoriaXML from './AuditoriaXML'; 
import VisorExpediente from './VisorExpediente';
import FacturasPendientes from './FacturasPendientes'; 

const AdminScreen = ({ onBack }) => {
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [selectedCliente, setSelectedCliente] = useState("");
    
    const [mostrarAuditoria, setMostrarAuditoria] = useState(false);
    const [mostrarGestor, setMostrarGestor] = useState(false);
    const [mostrarFacturas, setMostrarFacturas] = useState(false); 
    const [pendientesCount, setPendientesCount] = useState(0); 

    const [montoAbono, setMontoAbono] = useState("");
    const [pago, setPago] = useState({
        banco: "", beneficiario: "", clabe: "", concepto: "", 
        importeBase: "", diaLimite: "", pagado: false, ultimaFechaPago: "",
        importeVencido: 0,
        importeCorriente: 0
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
            const q = query(
                collection(db, "facturaciones", selectedCliente, "facturas"),
                where("estado", "==", "pendiente")
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setPendientesCount(snapshot.size);
            });
            return () => unsubscribe();
        } else {
            setPendientesCount(0);
        }
    }, [selectedCliente]);

    useEffect(() => {
        if (selectedCliente) {
            const cliente = clientes.find(c => c.id === selectedCliente);
            if (cliente) {
                const dp = cliente.datosPago || {};
                
                const base = parseFloat(dp.importeBase) || 0;
                const limite = parseInt(dp.diaLimite) || 1; 
                
                let corrienteActual = parseFloat(dp.importeCorriente) || 0;
                let vencidoActual = parseFloat(dp.importeVencido) || 0;
                let pagadoActual = dp.pagado || false;
                
                const hoy = new Date().getDate();
                const retraso = hoy - limite;
                let huboCambio = false;

                if (retraso > 2 && corrienteActual > 0) {
                    const montoMora = retraso > 7 ? 160 : 90;
                    vencidoActual = vencidoActual + corrienteActual + montoMora;
                    corrienteActual = 0;
                    pagadoActual = false; 
                    huboCambio = true;
                }

                const diasParaElLimite = limite - hoy;
                if (diasParaElLimite <= 7 && diasParaElLimite >= 0 && corrienteActual === 0) {
                    corrienteActual = base;
                    pagadoActual = false; 
                    huboCambio = true;
                }

                if (huboCambio) {
                    const userRef = doc(db, "usuarios", selectedCliente);
                    updateDoc(userRef, {
                        "datosPago.importeVencido": vencidoActual,
                        "datosPago.importeCorriente": corrienteActual,
                        "datosPago.pagado": pagadoActual,
                        "ultimoUpdate": serverTimestamp()
                    });
                }

                setPago({
                    ...pago,
                    banco: dp.banco || "",
                    beneficiario: dp.beneficiario || "",
                    clabe: dp.clabe || "",
                    concepto: dp.concepto || "",
                    importeBase: base,
                    diaLimite: limite,
                    importeVencido: vencidoActual,
                    importeCorriente: corrienteActual,
                    pagado: pagadoActual,
                    ultimaFechaPago: dp.ultimaFechaPago || ""
                });
                
                setModulos(cliente.modulosActivos || { facturas: true, declaraciones: true, constancia: true, opinion32d: true, facturacion: true, honorarios: true });
            }
        }
    }, [selectedCliente]);

    const handleAplicarAbono = async () => {
        if (!selectedCliente || !montoAbono) return alert("Ingresa un monto");
        const abono = parseFloat(montoAbono);
        const vActual = parseFloat(pago.importeVencido) || 0;
        const cActual = parseFloat(pago.importeCorriente) || 0;
        const diaLimite = parseInt(pago.diaLimite) || 1;
        const hoy = new Date().getDate();

        let mora = 0;
        if (hoy > diaLimite && (vActual > 0 || cActual > 0)) {
            const retraso = hoy - diaLimite;
            mora = retraso > 7 ? 160 : (retraso > 2 ? 90 : 0);
        }

        let deudaVencidaConMora = vActual + mora;
        let restanteAbono = abono;
        let nuevoVencido = deudaVencidaConMora - restanteAbono;
        if (nuevoVencido < 0) {
            restanteAbono = Math.abs(nuevoVencido);
            nuevoVencido = 0;
        } else {
            restanteAbono = 0;
        }

        let nuevoCorriente = cActual - restanteAbono;
        const quedaAlCorriente = nuevoVencido <= 0 && nuevoCorriente <= 0;

        const confirmacion = window.confirm(
            `RESUMEN DE OPERACIÓN:\nVencido + Mora: $${deudaVencidaConMora}\nCorriente: $${cActual}\nAbono: $${abono}\n\nNUEVO ESTADO:\nVencido: $${nuevoVencido}\nCorriente: $${nuevoCorriente}`
        );

        if (!confirmacion) return;

        const hoyFecha = new Date();
        const idMesActual = `${hoyFecha.getMonth() + 1}-${hoyFecha.getFullYear()}`;
        const nuevoPago = {
            ...pago,
            importeVencido: nuevoVencido,
            importeCorriente: nuevoCorriente,
            pagado: quedaAlCorriente,
            ultimaFechaPago: idMesActual
        };

        setPago(nuevoPago);
        setMontoAbono("");
        await handleActualizarPagoPersonalizado(nuevoPago);
    };

    const handleActualizarPagoPersonalizado = async (datosEditados) => {
        setCargando(true);
        try {
            const userRef = doc(db, "usuarios", selectedCliente);
            await updateDoc(userRef, { datosPago: datosEditados, ultimoUpdate: serverTimestamp() });
            alert("✅ Abono aplicado y saldo actualizado");
        } catch (e) { alert("Error: " + e.message); }
        setCargando(false);
    };

    const handleActualizarPago = async () => {
        if (!selectedCliente) return alert("Selecciona un cliente");
        setCargando(true);
        try {
            const userRef = doc(db, "usuarios", selectedCliente);
            const hoy = new Date();
            const idMesActual = `${hoy.getMonth() + 1}-${hoy.getFullYear()}`;
            
            const dataFinal = {
                ...pago,
                diaLimite: parseInt(pago.diaLimite) || 1, 
                importeVencido: parseFloat(pago.importeVencido) || 0,
                importeCorriente: parseFloat(pago.importeCorriente) || 0,
                ultimaFechaPago: pago.pagado ? idMesActual : (pago.ultimaFechaPago || "")
            };

            await updateDoc(userRef, { datosPago: dataFinal, ultimoUpdate: serverTimestamp() });

            setClientes(prevClientes => 
                prevClientes.map(c => 
                    c.id === selectedCliente ? { ...c, datosPago: dataFinal } : c
                )
            );

            setPago(dataFinal);
            alert("✅ Información actualizada correctamente");
        } catch (e) { alert("Error al actualizar: " + e.message); }
        setCargando(false);
    };

    const handleActualizarModulos = async () => {
        if (!selectedCliente) return alert("Selecciona un cliente");
        setCargando(true);
        try {
            const userRef = doc(db, "usuarios", selectedCliente);
            await updateDoc(userRef, { modulosActivos: modulos });
            alert("✅ Menú del cliente actualizado correctamente");
        } catch (e) { alert("Error al actualizar: " + e.message); }
        setCargando(false);
    };

    const clientesFiltrados = clientes.filter(c => 
        c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
        c.rfc?.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (mostrarAuditoria) return <AuditoriaXML rfcCliente={clientes.find(c => c.id === selectedCliente)?.rfc} onBack={() => setMostrarAuditoria(false)} />;
    if (mostrarGestor) {
        const clienteData = clientes.find(c => c.id === selectedCliente);
        return <VisorExpediente clienteId={selectedCliente} nombreCliente={clienteData?.nombre} onBack={() => setMostrarGestor(false)} />;
    }
    if (mostrarFacturas) {
        const clienteData = clientes.find(c => c.id === selectedCliente);
        return <FacturasPendientes clienteId={selectedCliente} nombreCliente={clienteData?.nombre} emailCliente={clienteData?.email} onBack={() => setMostrarFacturas(false)} />;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2 style={{textAlign: 'center', color: '#333'}}>Portal Fiscal Autónomo</h2>
            
            {/* SECCIÓN 1 */}
            <div style={s.section}>
                <h3 style={s.sectionTitle}>1. Seleccionar Cliente</h3>
                <input placeholder="🔍 Buscar por nombre o RFC..." style={s.inputBusqueda} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                <select style={s.input} value={selectedCliente} onChange={(e) => setSelectedCliente(e.target.value)}>
                    <option value="">-- Elegir Cliente ({clientesFiltrados.length}) --</option>
                    {clientesFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.rfc})</option>)}
                </select>
                
                {selectedCliente && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
                        <button type="button" onClick={() => setMostrarAuditoria(true)} style={{...s.btnMenu, backgroundColor: '#FF5722'}}>📂 ADMINISTRADOR DE XML</button>
                        <button type="button" onClick={() => setMostrarGestor(true)} style={{...s.btnMenu, backgroundColor: '#009688'}}>📁 GESTOR DE ARCHIVOS</button>
                        <button type="button" onClick={() => setMostrarFacturas(true)} style={{...s.btnMenu, backgroundColor: '#E91E63', display: 'flex', justifyContent: 'space-between'}}>
                            <span>📝 SOLICITUDES DE FACTURA</span>
                            <span style={s.badge}>{pendientesCount}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* SECCIÓN 2 */}
            <div style={{...s.section, borderLeft: '5px solid #9C27B0'}}>
                <h3 style={s.sectionTitle}>2. Módulos Visibles</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {Object.keys(modulos).map((key) => (
                        <label key={key} style={s.labelCheckbox}>
                            <input type="checkbox" checked={modulos[key]} onChange={(e) => setModulos({ ...modulos, [key]: e.target.checked })} />
                            {key.toUpperCase()}
                        </label>
                    ))}
                </div>
                <button type="button" onClick={handleActualizarModulos} disabled={cargando} style={{...s.btnAzul, backgroundColor: '#9C27B0'}}>Actualizar Menú</button>
            </div>

            {/* SECCIÓN 3: COBRANZA */}
            <div style={{...s.section, borderLeft: '5px solid #2196F3'}}>
                <h3 style={s.sectionTitle}>3. Honorarios y Cobranza Inteligente</h3>
                
                <div style={s.grid}>
                    <input placeholder="Banco" style={s.input} value={pago.banco} onChange={e => setPago({...pago, banco: e.target.value})} />
                    <input placeholder="Beneficiario" style={s.input} value={pago.beneficiario} onChange={e => setPago({...pago, beneficiario: e.target.value})} />
                </div>
                
                {/* FILA CONCEPTO Y CLABE */}
                <div style={{...s.grid, gridTemplateColumns: '1.5fr 1fr', marginTop: '8px'}}>
                    <input 
                        placeholder="Concepto de pago" 
                        style={s.input} 
                        value={pago.concepto} 
                        onChange={e => setPago({...pago, concepto: e.target.value})} 
                    />
                    <input 
                        placeholder="CLABE (18 dígitos)" 
                        style={s.input} 
                        value={pago.clabe} 
                        onChange={e => setPago({...pago, clabe: e.target.value})} 
                    />
                </div>
                
                <div style={{...s.grid, marginTop: '8px'}}>
                    <div style={s.col}>
                        <label style={s.miniLabel}>Mensualidad Base ($)</label>
                        <input type="number" style={s.input} value={pago.importeBase} onChange={e => setPago({...pago, importeBase: e.target.value})} />
                    </div>
                    <div style={s.col}>
                        <label style={s.miniLabel}>Día Límite</label>
                        <input type="number" style={s.input} value={pago.diaLimite} onChange={e => setPago({...pago, diaLimite: e.target.value})} />
                    </div>
                </div>

                <div style={{display: 'flex', gap: '10px', marginTop: '10px', textAlign: 'center'}}>
                    <div style={{flex: 1, padding: '8px', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #feb2b2'}}>
                        <span style={{fontSize: '10px', color: '#c53030', fontWeight: 'bold'}}>VENCIDO ($)</span>
                        <input type="number" style={{...s.input, textAlign: 'center', fontWeight: 'bold', marginTop: '5px'}} value={pago.importeVencido} onChange={e => setPago({...pago, importeVencido: e.target.value})} />
                    </div>
                    <div style={{flex: 1, padding: '8px', backgroundColor: '#f0fff4', borderRadius: '8px', border: '1px solid #9ae6b4'}}>
                        <span style={{fontSize: '10px', color: '#2f855a', fontWeight: 'bold'}}>CORRIENTE ($)</span>
                        <input type="number" style={{...s.input, textAlign: 'center', fontWeight: 'bold', marginTop: '5px'}} value={pago.importeCorriente} onChange={e => setPago({...pago, importeCorriente: e.target.value})} />
                    </div>
                </div>

                <div style={{marginTop: '15px', padding: '12px', backgroundColor: '#f0f7ff', borderRadius: '8px', border: '1px dashed #2196F3'}}>
                    <label style={{...s.miniLabel, color: '#2196F3', fontWeight: 'bold'}}>REGISTRAR PAGO RECIBIDO (AUTO-DESCUENTO)</label>
                    <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                        <input type="number" placeholder="$ Monto" style={s.input} value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)} />
                        <button type="button" onClick={handleAplicarAbono} style={{...s.btnAzul, marginTop: 0, backgroundColor: '#4CAF50', whiteSpace: 'nowrap'}}>Aplicar</button>
                    </div>
                </div>

                <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                    <button type="button" onClick={() => setPago({...pago, pagado: !pago.pagado})} style={{...s.btnSwitch, backgroundColor: pago.pagado ? '#4CAF50' : '#f44336'}}>
                        {pago.pagado ? "STATUS: AL CORRIENTE ✅" : "STATUS: CON ADEUDO ⏳"}
                    </button>
                    <button type="button" onClick={(e) => { e.preventDefault(); handleActualizarPago(); }} disabled={cargando} style={s.btnAzulPrincipal}>
                        {cargando ? "..." : "Guardar Datos"}
                    </button>
                </div>
            </div>

            <button type="button" onClick={onBack} style={s.btnBack}>← Salir al Inicio</button>
        </div>
    );
};

const s = {
    section: { backgroundColor: '#fff', padding: '18px', borderRadius: '12px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    sectionTitle: { margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold', color: '#444' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #eee', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    inputBusqueda: { padding: '10px', borderRadius: '8px', border: '1px solid #eee', fontSize: '14px', backgroundColor: '#f0f8ff', marginBottom: '5px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    col: { display: 'flex', flexDirection: 'column' },
    miniLabel: { fontSize: '11px', color: '#888', marginBottom: '2px', marginLeft: '5px' },
    btnMenu: { padding: '14px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
    btnAzul: { padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' },
    btnAzulPrincipal: { flex: 1, padding: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnSwitch: { flex: 1, padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' },
    btnBack: { width: '100%', padding: '12px', backgroundColor: '#eee', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' },
    badge: { backgroundColor: 'white', color: '#E91E63', borderRadius: '50%', padding: '2px 8px', fontSize: '12px' },
    labelCheckbox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }
};

export default AdminScreen;