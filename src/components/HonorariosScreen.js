import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc } from "firebase/firestore";

const HonorariosScreen = ({ onBack }) => {
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
                    if (userDoc.exists() && userDoc.data().datosPago) {
                        setDatos(userDoc.data().datosPago);
                    }
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchDatos();
    }, []);

    const obtenerCalculoTotal = () => {
        if (!datos) return { total: 0, recargo: 0, mensaje: "" };
        const hoy = new Date();
        const diaActual = hoy.getDate();
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
        
        let diaCorte = parseInt(datos.diaCorte) || 12;
        if (diaCorte > ultimoDiaMes) diaCorte = ultimoDiaMes;

        const importeBase = parseFloat(datos.importe) || 0;
        let recargo = 0;
        let mensaje = "";
        let totalFinal = 0;

        // --- LÓGICA DE COBRO PERSONALIZADA ---
        
        const diasParaElPago = diaCorte - diaActual;
        const enVentanaNuevoMes = (diasParaElPago >= 0 && diasParaElPago <= 7);

        // 1. SI EL ADMIN REINICIÓ (Botón Naranja) -> Solo cobramos el mes actual limpio
        if (datos.concepto === "HONORARIOS MES EN CURSO") {
            recargo = 0;
            totalFinal = importeBase;
            mensaje = "✨ Próximo pago mensual (Sin recargos)";
        } 
        // 2. SI ESTAMOS ANTES DEL CORTE PERO NO HA PAGADO EL ANTERIOR (Deuda acumulada)
        else if (diaActual < diaCorte && !datos.pagado) {
            if (enVentanaNuevoMes) {
                // Se juntan los dos meses + mora por el atraso de 150
                recargo = 150;
                totalFinal = (importeBase * 2) + recargo;
                mensaje = "🚨 DEUDA ACUMULADA: 2 Meses + Recargo $150.00";
            } else {
                // Solo debe el anterior con mora máxima
                recargo = 150;
                totalFinal = importeBase + recargo;
                mensaje = "🚫 PAGO VENCIDO: Mes anterior + Recargo $150.00";
            }
        }
        // 3. SI YA PASÓ EL DÍA DE CORTE (Mes actual en mora)
        else if (diaActual >= diaCorte && !datos.pagado) {
            if (diaActual > (diaCorte + 12)) {
                recargo = 150;
                mensaje = "🚫 PAGO MUY VENCIDO: Recargo acumulado de $150.00";
            } else if (diaActual > (diaCorte + 7)) {
                recargo = 95;
                mensaje = "🚫 Pago vencido: Recargo acumulado de $95.00";
            } else if (diaActual > (diaCorte + 2)) {
                recargo = 45;
                mensaje = "⚠️ Recargo por mora aplicado: $45.00";
            }
            totalFinal = importeBase + recargo;
        }

        return { total: totalFinal, recargo, mensaje };
    };

    const verificarVisibilidad = () => {
        if (!datos) return false;
        if (datos.pagado) return true; 

        const hoy = new Date();
        const diaActual = hoy.getDate();
        const diaCorte = parseInt(datos.diaCorte) || 12;
        const diasParaElPago = diaCorte - diaActual;
        
        return (diasParaElPago <= 7 || diaActual >= diaCorte || (diaActual < diaCorte && !datos.pagado));
    };

    const copiarClabe = () => {
        navigator.clipboard.writeText(datos.clabe);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}><h3>Cargando...</h3></div>;

    if (!verificarVisibilidad()) return (
        <div style={{padding: '50px', textAlign: 'center', fontFamily: 'Arial'}}>
            <div style={{fontSize: '50px'}}>⏳</div>
            <h3 style={{color: '#666'}}>Próximamente...</h3>
            <p style={{color: '#999', fontSize: '14px'}}>Tu ficha de pago se activará 7 días antes del día {datos?.diaCorte}.</p>
            <button onClick={onBack} style={s.btnBack}>Volver</button>
        </div>
    );

    if (datos.pagado) return (
        <div style={s.container}>
            <div style={{...s.card, textAlign: 'center', border: '2px solid #4CAF50'}}>
                <div style={{fontSize: '60px', marginBottom: '10px'}}>✅</div>
                <h2 style={{color: '#4CAF50'}}>¡Pago Recibido!</h2>
                <p style={{color: '#666', fontSize: '14px'}}>Hemos validado tu pago correctamente. Gracias por tu puntualidad.</p>
            </div>
            <button onClick={onBack} style={s.btnBack}>Volver al Menú</button>
        </div>
    );

    const infoPago = obtenerCalculoTotal();

    return (
        <div style={s.container}>
            <h2 style={s.title}>Ficha de Pago</h2>
            <div style={s.card}>
                <div style={s.badge}>TRANSFERENCIA SPEI</div>

                <div style={{
                    backgroundColor: '#fff9c4', 
                    padding: '10px', 
                    borderRadius: '10px', 
                    marginBottom: '15px', 
                    textAlign: 'center',
                    border: '1px solid #fbc02d'
                }}>
                    <span style={{fontSize: '10px', color: '#f57f17', fontWeight: 'bold', display: 'block'}}>FECHA LÍMITE DE PAGO:</span>
                    <span style={{fontSize: '14px', color: '#333', fontWeight: 'bold'}}>DÍA {datos.diaCorte || '12'} DE CADA MES</span>
                </div>
                
                <div style={s.row}><span style={s.label}>INSTITUCIÓN BANCARIA</span><span style={s.value}>{datos.banco}</span></div>
                <div style={s.row}><span style={s.label}>BENEFICIARIO</span><span style={s.value}>{datos.beneficiario}</span></div>
                <div style={s.row}><span style={s.label}>CLABE INTERBANCARIA</span>
                    <div style={s.clabeContainer}>
                        <span style={{...s.value, color: '#1976d2'}}>{datos.clabe}</span>
                        <button onClick={copiarClabe} style={s.btnCopy}>{copiado ? "¡Copiado!" : "Copiar"}</button>
                    </div>
                </div>
                <div style={s.row}><span style={s.label}>CONCEPTO</span><span style={s.value}>{datos.concepto}</span></div>
                
                {infoPago.mensaje && (
                    <p style={{
                        color: infoPago.recargo > 0 ? '#d32f2f' : '#1976d2', 
                        fontSize: '12px', 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        margin: '10px 0',
                        backgroundColor: infoPago.recargo >= 150 ? '#ffebee' : 'transparent',
                        padding: infoPago.recargo >= 150 ? '8px' : '0',
                        borderRadius: '5px'
                    }}>
                        {infoPago.mensaje}
                    </p>
                )}
                
                <div style={s.importContainer}>
                    <span style={s.labelImporte}>TOTAL A DEPOSITAR HOY</span>
                    <h1 style={s.monto}>${infoPago.total.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN</h1>
                </div>
            </div>
            <button onClick={onBack} style={s.btnBack}>← Volver al Menú</button>
            <p style={s.footerNote}>* Envía tu comprobante al despacho una vez realizado el pago.</p>
        </div>
    );
};

const s = {
    container: { padding: '20px', maxWidth: '450px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    title: { textAlign: 'center', color: '#333', marginBottom: '20px', fontWeight: 'bold' },
    card: { backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '15px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' },
    badge: { position: 'absolute', top: '0', right: '0', backgroundColor: '#1976d2', color: 'white', fontSize: '10px', padding: '5px 15px', borderRadius: '0 0 0 15px', fontWeight: 'bold' },
    row: { marginBottom: '18px', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '10px', color: '#888', fontWeight: 'bold', marginBottom: '4px' },
    value: { fontSize: '15px', color: '#222', fontWeight: 'bold', textTransform: 'uppercase' },
    clabeContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px dashed #ccc' },
    btnCopy: { backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' },
    importContainer: { textAlign: 'center', backgroundColor: '#f0f7ff', padding: '20px', borderRadius: '12px' },
    labelImporte: { fontSize: '11px', color: '#1976d2', fontWeight: 'bold' },
    monto: { fontSize: '30px', color: '#1976d2', margin: '5px 0', fontWeight: '900' },
    btnBack: { width: '100%', padding: '14px', marginTop: '20px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold' },
    footerNote: { textAlign: 'center', fontSize: '11px', color: '#999', marginTop: '20px' }
};

export default HonorariosScreen;