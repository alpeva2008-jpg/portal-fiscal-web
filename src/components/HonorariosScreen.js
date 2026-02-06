import React, { useState } from 'react';

const HonorariosScreen = ({ datosPago, onBack }) => {
    const [copiado, setCopiado] = useState(false);

    // LÓGICA INTACTA
    const pagoSeguro = datosPago || {
        clabe: "000000000000000000",
        pagado: false,
        diaLimite: 15,
        importeVencido: 0,
        importeCorriente: 0,
        banco: "Pendiente",
        beneficiario: "Pendiente",
        concepto: "Honorarios Profesionales"
    };

    const hoy = new Date();
    const diaActual = hoy.getDate();

    const copiarClabe = () => {
        navigator.clipboard.writeText(pagoSeguro.clabe);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    const diaLimite = parseInt(pagoSeguro.diaLimite) || 1;
    const vencido = parseFloat(pagoSeguro.importeVencido) || 0;
    const corriente = parseFloat(pagoSeguro.importeCorriente) || 0;
    const baseAntiguo = parseFloat(pagoSeguro.importeBase) || 0;

    let totalCalculado = vencido + corriente;
    if (totalCalculado === 0 && baseAntiguo > 0 && !pagoSeguro.pagado) {
        totalCalculado = baseAntiguo; 
    }

    let mora = 0;
    let mensajeMora = "";
    let colorMora = "#4286f4"; // Azul acero por defecto

    if (totalCalculado > 0 && diaActual > diaLimite) {
        const diasRetraso = diaActual - diaLimite;
        if (diasRetraso > 7) { 
            mora = 160; 
            mensajeMora = "Recargo por morosidad (+$160)"; 
            colorMora = "#ff4d4d"; // Rojo vibrante
        }
        else if (diasRetraso > 2) { 
            mora = 90; 
            mensajeMora = "Recargo por pago tardío (+$90)"; 
            colorMora = "#ffa726"; // Naranja sutil
        }
    }

    const totalFinal = totalCalculado + mora;

    // --- RENDER: ESTADO AL CORRIENTE ---
    if (pagoSeguro.pagado && totalFinal === 0) {
        return (
            <div style={s.contenedorPrincipal}>
                <div style={s.card}>
                    <div style={s.iconoExito}>✅</div>
                    <h3 style={{color: '#fff'}}>¡Estás al corriente!</h3>
                    <p style={{color: 'rgba(255,255,255,0.6)'}}>No tienes saldos pendientes este mes.</p>
                    <button onClick={onBack} style={s.btnBackInside}>← Volver al Menú</button>
                </div>
            </div>
        );
    }

    // --- RENDER: SALDO A FAVOR ---
    if (totalFinal < 0) {
        return (
            <div style={s.contenedorPrincipal}>
                <div style={{...s.card, border: '1px solid #4CAF50'}}>
                    <div style={{...s.headerFicha, background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'}}>
                        <h3 style={{margin: 0, color: 'white'}}>SALDO A FAVOR</h3>
                        <span style={{fontSize: '11px', color: 'rgba(255,255,255,0.8)'}}>¡GRACIAS POR TU PUNTUALIDAD!</span>
                    </div>
                    <div style={s.cuerpoFicha}>
                        <div style={{fontSize: '50px', marginBottom: '10px', textAlign: 'center'}}>💰</div>
                        <p style={s.label}>Monto disponible:</p>
                        <div style={{...s.montoTotal, color: '#4CAF50', fontSize: '40px', textAlign: 'center', margin: '15px 0'}}>
                            ${Math.abs(totalFinal).toFixed(2)}
                        </div>
                        <p style={{...s.nota, color: 'rgba(255,255,255,0.5)'}}>
                            Este monto se descontará automáticamente de tus próximos honorarios.
                        </p>
                    </div>
                </div>
                <button onClick={onBack} style={s.btnBack}>← Volver al Menú</button>
            </div>
        );
    }

    // --- RENDER: FICHA DE PAGO ESTÁNDAR ---
    return (
        <div style={s.contenedorPrincipal}>
            <div style={s.card}>
                <div style={{...s.headerFicha, background: `linear-gradient(135deg, ${colorMora} 0%, #1a1a1a 100%)`}}>
                    <h3 style={{margin: 0, color: 'white'}}>FICHA DE PAGO</h3>
                    <span style={{fontSize: '11px', color: 'rgba(255,255,255,0.8)'}}>VENCE EL DÍA {diaLimite} DE CADA MES</span>
                </div>

                <div style={s.cuerpoFicha}>
                    <p style={s.label}>Banco</p>
                    <p style={s.dato}>{pagoSeguro.banco}</p>

                    <p style={s.label}>Beneficiario</p>
                    <p style={s.dato}>{pagoSeguro.beneficiario}</p>

                    <p style={s.label}>CLABE Interbancaria</p>
                    <div style={s.clabeRow}>
                        <p style={{...s.datoClabe, color: '#fff'}}>{pagoSeguro.clabe}</p>
                        <button onClick={copiarClabe} style={{...s.btnCopy, background: colorMora}}>
                            {copiado ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>

                    <p style={s.label}>Concepto de Pago</p>
                    <p style={{...s.dato, color: '#4286f4'}}>{pagoSeguro.concepto || "Honorarios Profesionales"}</p>

                    <hr style={s.divider} />

                    {vencido > 0 && (
                        <div style={s.filaImporte}>
                            <span>Saldo Vencido:</span>
                            <span style={{color: '#ff4d4d', fontWeight: 'bold'}}>${vencido.toFixed(2)}</span>
                        </div>
                    )}

                    <div style={s.filaImporte}>
                        <span>Saldo Próximo:</span>
                        <span>${corriente.toFixed(2)}</span>
                    </div>

                    {mora > 0 && (
                        <div style={{...s.filaImporte, color: colorMora, fontSize: '13px', fontWeight: 'bold'}}>
                            <span>{mensajeMora}</span>
                        </div>
                    )}

                    <div style={{...s.totalCaja, borderLeft: `5px solid ${colorMora}`}}>
                        <span style={{fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)'}}>TOTAL A DEPOSITAR:</span>
                        <span style={{...s.montoTotal, color: '#fff'}}>
                            ${totalFinal.toFixed(2)}
                        </span>
                    </div>
                    
                    <p style={s.nota}>* El sistema se actualiza automáticamente tras recibir el pago.</p>
                </div>
            </div>
            <button onClick={onBack} style={s.btnBack}>← Volver al Menú Principal</button>
        </div>
    );
};

const s = {
    contenedorPrincipal: { 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Segoe UI, Roboto, sans-serif'
    },
    card: { 
        backgroundColor: 'rgba(15, 32, 39, 0.85)', 
        borderRadius: '28px', 
        overflow: 'hidden', 
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)', 
        width: '100%',
        maxWidth: '400px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(15px)',
        zIndex: 1
    },
    headerFicha: { padding: '25px', textAlign: 'center' },
    cuerpoFicha: { padding: '25px' },
    label: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '15px 0 4px 0', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' },
    dato: { fontSize: '16px', fontWeight: '600', margin: '0', color: '#fff' },
    clabeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' },
    datoClabe: { fontSize: '16px', fontWeight: '700', letterSpacing: '1px', margin: 0, fontFamily: 'monospace' },
    btnCopy: { border: 'none', color: 'white', padding: '8px 15px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
    divider: { border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' },
    filaImporte: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' },
    totalCaja: { marginTop: '20px', padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    montoTotal: { fontSize: '28px', fontWeight: '800' },
    iconoExito: { fontSize: '60px', marginBottom: '15px', textAlign: 'center' },
    nota: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '20px', fontStyle: 'italic', textAlign: 'center' },
    btnBack: { marginTop: '25px', width: '100%', maxWidth: '400px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' },
    btnBackInside: { marginTop: '20px', padding: '12px 25px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#fff' }
};

export default HonorariosScreen;