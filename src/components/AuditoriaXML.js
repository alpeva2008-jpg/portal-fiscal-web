import React, { useState, useMemo } from 'react';
import { XMLParser } from 'fast-xml-parser';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Cambiamos la forma de importar

const CATALOGO_PAGO = {
    "01": "Efectivo", "02": "Cheque", "03": "Transferencia", "04": "T. Crédito",
    "05": "Monedero", "06": "Dinero Elect.", "08": "Vales", "28": "T. Débito",
    "99": "Por definir"
};

const CATALOGO_RET = {
    "01": "Serv. Profesionales", "02": "Regalías", "03": "Autotransporte", 
    "06": "Premios", "14": "Dividendos", "25": "Otro"
};

const AuditoriaXML = ({ rfcCliente, onBack }) => {
    const [ingresos, setIngresos] = useState([]);
    const [gastos, setGastos] = useState([]);
    const [retenciones, setRetenciones] = useState([]); 
    const [errores, setErrores] = useState([]);

    const procesarArchivosXML = (e) => {
        const files = Array.from(e.target.files);
        if (!rfcCliente) return alert("RFC del cliente no definido.");

        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", removeNSPrefix: true });
        const rfcC = rfcCliente.toString().trim().toUpperCase();
        
        let nuevosIngresos = [], nuevosGastos = [], nuevasRetenciones = [], listaErrores = [];
        let procesados = 0;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const jsonObj = parser.parse(event.target.result);
                    const getVal = (obj, key) => obj ? (obj[key] || (obj["@_"] && obj["@_"][key]) || "") : "";

                    const esRet = jsonObj.Retenciones !== undefined;
                    const compKey = Object.keys(jsonObj).find(k => k.toLowerCase().includes("comprobante"));
                    const comp = esRet ? jsonObj.Retenciones : jsonObj[compKey];

                    if (comp) {
                        if (esRet) {
                            const rfcE = (getVal(comp.Emisor, "RfcE") || getVal(comp.Emisor, "Rfc") || "").toUpperCase();
                            const receptorNodo = comp.Receptor || {};
                            const rfcR = (getVal(receptorNodo.Nacional, "RfcR") || getVal(receptorNodo.Extranjero, "RfcR") || getVal(receptorNodo, "RfcR") || "").toUpperCase();
                            
                            if (rfcE === rfcC || rfcR === rfcC) {
                                let rIVA = 0, rISR = 0, tIVA = 0;
                                const impRet = comp.Totales?.ImpRetenidos;
                                if (impRet) {
                                    const list = Array.isArray(impRet) ? impRet : [impRet];
                                    list.forEach(i => {
                                        const tipoImp = getVal(i, "ImpuestoRet");
                                        const monto = parseFloat(getVal(i, "MontoRet") || 0);
                                        if (tipoImp === "01" || tipoImp === "001") rISR += monto;
                                        if (tipoImp === "02" || tipoImp === "002") rIVA += monto;
                                    });
                                }
                                const complem = comp.Complemento?.ServiciosPlataformasTecnologicas;
                                if (complem) tIVA = parseFloat(getVal(complem, "TotalIVATrasladado") || 0);

                                nuevasRetenciones.push({
                                    id: Math.random(), 
                                    emisorNombre: getVal(comp.Emisor, "NomDenRazSocE") || rfcE,
                                    receptorNombre: getVal(receptorNodo.Nacional, "NomDenRazSocR") || rfcR,
                                    tipoRet: CATALOGO_RET[getVal(comp, "CveRetenc")] || "Retención",
                                    subtotal: parseFloat(getVal(comp.Totales, "MontoTotOperacion") || 0),
                                    ivaT: tIVA, ivaR: rIVA, isrR: rISR, 
                                    periodo: `Mes ${getVal(comp.Periodo, "MesIni")} - ${getVal(comp.Periodo, "MesFin")}`,
                                    clasificacion: 'pendiente'
                                });
                            } else {
                                listaErrores.push(`${file.name}: RFC ajeno`);
                            }
                        } else {
                            const rfcE = (getVal(comp.Emisor, "Rfc") || "").toString().toUpperCase();
                            const rfcR = (getVal(comp.Receptor, "Rfc") || "").toString().toUpperCase();
                            if (rfcE === rfcC || rfcR === rfcC) {
                                const tipo = getVal(comp, "TipoDeComprobante") || "I";
                                let sub = 0, ivaT = 0, ivaR = 0, isrR = 0;
                                if (tipo === 'P') {
                                    const tP = comp.Complemento?.Pagos?.Totales;
                                    const montoP = parseFloat(getVal(tP, "MontoTotalPagos") || 0);
                                    ivaT = parseFloat(getVal(tP, "TotalTrasladosImpuestoIVA16") || 0);
                                    sub = montoP - ivaT;
                                } else {
                                    sub = parseFloat(getVal(comp, "SubTotal") || 0);
                                    const imp = comp.Impuestos || {};
                                    const tras = imp.Traslados?.Traslado;
                                    if (tras) (Array.isArray(tras) ? tras : [tras]).forEach(t => { if (getVal(t, "Impuesto") === "002") ivaT += parseFloat(getVal(t, "Importe") || 0); });
                                    const rets = imp.Retenciones?.Retencion;
                                    if (rets) (Array.isArray(rets) ? rets : [rets]).forEach(r => {
                                        if (getVal(r, "Impuesto") === "002") ivaR += parseFloat(getVal(r, "Importe") || 0);
                                        if (getVal(r, "Impuesto") === "001") isrR += parseFloat(getVal(r, "Importe") || 0);
                                    });
                                }
                                const datos = {
                                    id: comp.Complemento?.TimbreFiscalDigital ? getVal(comp.Complemento.TimbreFiscalDigital, "UUID") : file.name,
                                    emisorNombre: getVal(comp.Emisor, "Nombre") || rfcE, receptorNombre: getVal(comp.Receptor, "Nombre") || rfcR,
                                    tipoDeComprobante: tipo, subtotal: sub, ivaT, ivaR, isrR,
                                    descripcion: tipo === 'P' ? "COMPLEMENTO DE PAGO" : (comp.Conceptos?.Concepto?.Descripcion || "S/D"),
                                    formaPago: tipo === 'P' ? "Pago Electrónico" : (CATALOGO_PAGO[getVal(comp, "FormaPago")] || "N/A"),
                                    metodoPago: getVal(comp, "MetodoPago") || "N/A", clasificacion: 'pendiente'
                                };
                                if (rfcE === rfcC) nuevosIngresos.push(datos); else nuevosGastos.push(datos);
                            } else {
                                listaErrores.push(`${file.name}: RFC ajeno`);
                            }
                        }
                    }
                } catch (e) { listaErrores.push(`Error: ${file.name}`); }
                finally {
                    procesados++;
                    if (procesados === files.length) {
                        setIngresos(nuevosIngresos); setGastos(nuevosGastos); setRetenciones(nuevasRetenciones); setErrores(listaErrores);
                    }
                }
            };
            reader.readAsText(file);
        });
    };

    const generarPDF = () => {
        const doc = new jsPDF();
        const fecha = new Date().toLocaleDateString();

        doc.setFontSize(18);
        doc.text("Reporte de Auditoría XML", 14, 20);
        doc.setFontSize(11);
        doc.text(`Cliente: ${rfcCliente}`, 14, 30);
        doc.text(`Fecha de generación: ${fecha}`, 14, 35);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("*Totales calculados únicamente sobre conceptos AUTORIZADOS", 14, 40);

        const buildTable = (titulo, data, yStart) => {
            if (data.length === 0) return yStart;

            // FILTRO: Solo sumar si están autorizados
            const autorizados = data.filter(i => i.clasificacion === 'autorizado');
            
            const totalSub = autorizados.reduce((acc, i) => acc + i.subtotal, 0);
            const totalIvaT = autorizados.reduce((acc, i) => acc + (i.ivaT || 0), 0);
            const totalIvaR = autorizados.reduce((acc, i) => acc + (i.ivaR || 0), 0);
            const totalIsrR = autorizados.reduce((acc, i) => acc + (i.isrR || 0), 0);

            doc.setFontSize(14);
            doc.setTextColor(40);
            doc.text(titulo, 14, yStart);
            
            const rows = data.map(i => [
                i.emisorNombre.substring(0, 20),
                i.receptorNombre.substring(0, 20),
                `$${i.subtotal.toFixed(2)}`,
                `$${(i.ivaT || 0).toFixed(2)}`,
                `$${(i.ivaR || 0).toFixed(2)}`,
                `$${(i.isrR || 0).toFixed(2)}`,
                i.clasificacion.toUpperCase()
            ]);

            // Agregar fila de totales filtrados
            rows.push([
                { content: 'TOTAL AUTORIZADOS', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 245, 230] } },
                { content: `$${totalSub.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [230, 245, 230] } },
                { content: `$${totalIvaT.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [230, 245, 230] } },
                { content: `$${totalIvaR.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [230, 245, 230] } },
                { content: `$${totalIsrR.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [230, 245, 230] } },
                { content: '', styles: { fillColor: [230, 245, 230] } }
            ]);

            autoTable(doc, {
                startY: yStart + 5,
                head: [['Emisor', 'Receptor', 'Subtotal', 'IVA Tras', 'IVA Ret', 'ISR Ret', 'Status']],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: [69, 90, 100] },
                styles: { fontSize: 8 },
                didParseCell: (data) => {
                    // Pintar de rojo si el status es NO_AUTORIZADO para que resalte
                    if (data.section === 'body' && data.column.index === 6 && data.cell.raw === 'NO_AUTORIZADO') {
                        data.cell.styles.textColor = [200, 0, 0];
                    }
                }
            });
            return doc.lastAutoTable.finalY + 15;
        };

        let currentY = 50;
        currentY = buildTable(" INGRESOS", ingresos, currentY);
        currentY = buildTable(" GASTOS", gastos, currentY);
        currentY = buildTable(" RETENCIONES", retenciones, currentY);

        doc.save(`Auditoria_${rfcCliente}_${fecha}.pdf`);
    };
    const cambiarClasificacion = (tipo, id, nueva) => {
        const setter = tipo === 'ingreso' ? setIngresos : tipo === 'gasto' ? setGastos : setRetenciones;
        setter(prev => prev.map(i => i.id === id ? { ...i, clasificacion: nueva } : i));
    };

    const tIng = useMemo(() => obtenerTotales(ingresos), [ingresos]);
    const tGas = useMemo(() => obtenerTotales(gastos), [gastos]);
    const tRet = useMemo(() => obtenerTotales(retenciones), [retenciones]);

    return (
        <div style={s.container}>
            <header style={s.header}>
                <div>
                    <h1 style={{margin:0, fontSize:'32px'}}>Auditoría de XML</h1>
                    <p style={{fontSize:'20px'}}>Cliente: <strong>{rfcCliente}</strong></p>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={generarPDF} style={s.btnPdf}>📥 GENERAR PDF</button>
                    <button onClick={onBack} style={s.btnBack}>⇠ REGRESAR</button>
                </div>
            </header>
            
            {/* ... Resto del componente visual se mantiene igual ... */}
            <div style={s.uploadBox}><input type="file" multiple accept=".xml" onChange={procesarArchivosXML} /></div>

            {errores.length > 0 && (
                <div style={s.errorBox}>
                    <strong style={{display: 'block', marginBottom: '5px'}}>Aviso:</strong>
                    {errores.map((err, idx) => (<div key={idx} style={{fontSize: '14px'}}>{err}</div>))}
                </div>
            )}

            <SeccionOriginal titulo="📈 Ingresos (Emisor)" data={ingresos} totales={tIng} tipo="ingreso" onCambiar={cambiarClasificacion} color="#2196F3" />
            <div style={{height: '50px'}} />
            <SeccionOriginal titulo="📉 Gastos (Receptor)" data={gastos} totales={tGas} tipo="gasto" onCambiar={cambiarClasificacion} color="#F44336" />
            <div style={{height: '50px'}} />
            <SeccionRetenciones data={retenciones} totales={tRet} onCambiar={cambiarClasificacion} />
        </div>
    );
};

// ... Mantener SeccionOriginal, SeccionRetenciones, CardResumen, obtenerTotales y estilos s (añadiendo btnPdf y errorBox) ...

const SeccionOriginal = ({ titulo, data, totales, tipo, onCambiar, color }) => (
    <div style={s.seccion}>
        <div style={s.seccionHeader}>
            <h2 style={{ color, margin: 0, fontSize: '28px' }}>{titulo}</h2>
            <div style={s.rowMiniResumen}>
                <CardResumen label="AUTORIZADOS" datos={totales.aut} color="#2e7d32" />
                <CardResumen label="RECHAZADOS" datos={totales.noAut} color="#c62828" />
            </div>
        </div>
        <div style={s.tableScroll}>
            <table style={s.table}>
                <thead>
                    <tr style={s.thRow}>
                        <th style={{...s.th, width: '160px'}}>Emisor</th>
                        <th style={{...s.th, width: '160px'}}>Receptor</th>
                        <th style={s.th}>Descripción</th>
                        <th style={{...s.th, width: '120px'}}>F. Pago</th>
                        <th style={{...s.th, width: '60px'}}>M.P.</th>
                        <th style={{...s.th, width: '70px', textAlign: 'center'}}>Tipo</th>
                        <th style={{...s.th, width: '220px', textAlign: 'right', paddingRight: '25px'}}>Importes</th>
                        <th style={{...s.th, width: '130px', textAlign: 'center'}}>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(f => (
                        <tr key={f.id} style={{...s.tr, backgroundColor: f.clasificacion === 'no_autorizado' ? '#fff5f5' : f.clasificacion === 'autorizado' ? '#f5fff5' : 'inherit'}}>
                            <td style={s.tdSmall}>{f.emisorNombre}</td>
                            <td style={s.tdSmall}>{f.receptorNombre}</td>
                            <td style={s.td}><div style={s.descTwoLines}>{f.descripcion}</div></td>
                            <td style={s.tdSmall}>{f.formaPago}</td>
                            <td style={s.tdSmall}>{f.metodoPago}</td>
                            <td style={{...s.tdSmall, textAlign: 'center', fontWeight: 'bold'}}>{f.tipoDeComprobante}</td>
                            <td style={s.tdImportes}>
                                <div style={s.montoPrincipal}>$ {f.subtotal.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                                <div style={s.montoIvaT}>IVA T: ${f.ivaT.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                                <div style={s.montoIvaR}>IVA R: ${f.ivaR.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                                <div style={s.montoIsrR}>ISR R: ${f.isrR.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                            </td>
                            <td style={s.td}><div style={s.btnGroup}>
                                <button onClick={() => onCambiar(tipo, f.id, 'autorizado')} style={{...s.btnRound, backgroundColor: f.clasificacion === 'autorizado' ? '#2e7d32' : '#f0f0f0', color: f.clasificacion === 'autorizado' ? '#fff' : '#aaa'}}>✓</button>
                                <button onClick={() => onCambiar(tipo, f.id, 'no_autorizado')} style={{...s.btnRound, backgroundColor: f.clasificacion === 'no_autorizado' ? '#c62828' : '#f0f0f0', color: f.clasificacion === 'no_autorizado' ? '#fff' : '#aaa'}}>✕</button>
                            </div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const SeccionRetenciones = ({ data, totales, onCambiar }) => (
    <div style={s.seccion}>
        <div style={s.seccionHeader}>
            <h2 style={{ color: '#673AB7', margin: 0, fontSize: '28px' }}>🔒 Retenciones</h2>
            <div style={s.rowMiniResumen}>
                <CardResumen label="AUTORIZADOS" datos={totales.aut} color="#2e7d32" />
            </div>
        </div>
        <div style={s.tableScroll}>
            <table style={s.table}>
                <thead>
                    <tr style={s.thRow}>
                        <th style={{...s.th, width: '200px'}}>Emisor / Receptor</th>
                        <th style={s.th}>Tipo Retención / Periodo</th>
                        <th style={{...s.th, width: '250px', textAlign: 'right', paddingRight: '25px'}}>Importes</th>
                        <th style={{...s.th, width: '130px', textAlign: 'center'}}>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(f => (
                        <tr key={f.id} style={{...s.tr, backgroundColor: f.clasificacion === 'autorizado' ? '#f5fff5' : 'inherit'}}>
                            <td style={s.tdSmall}><strong>E:</strong> {f.emisorNombre}<br/><strong>R:</strong> {f.receptorNombre}</td>
                            <td style={s.td}>{f.tipoRet}<br/><small>{f.periodo}</small></td>
                            <td style={s.tdImportes}>
                                <div style={s.montoPrincipal}>Base: ${f.subtotal.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                                <div style={s.montoIvaT}>IVA Tras: ${f.ivaT.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                                <div style={s.montoIvaR}>IVA Ret: ${f.ivaR.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                                <div style={s.montoIsrR}>ISR Ret: ${f.isrR.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                            </td>
                            <td style={s.td}><div style={s.btnGroup}>
                                <button onClick={() => onCambiar('retencion', f.id, 'autorizado')} style={{...s.btnRound, backgroundColor: f.clasificacion === 'autorizado' ? '#2e7d32' : '#f0f0f0', color: f.clasificacion === 'autorizado' ? '#fff' : '#aaa'}}>✓</button>
                            </div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const CardResumen = ({ datos, color, label }) => (
    <div style={{...s.cardResumenFull, borderLeft: `6px solid ${color}`}}>
        <div style={s.resumenPrincipal}><span style={s.labelMini}>{label}</span><div style={{...s.valorMini, color}}>$ {datos.sub.toLocaleString(undefined, {minimumFractionDigits:2})}</div></div>
        <div style={s.resumenDetalle}>
            <div style={s.miniDato}><span>IVA T:</span> <strong>${datos.ivaT.toLocaleString(undefined, {minimumFractionDigits:2})}</strong></div>
            <div style={s.miniDato}><span>IVA R:</span> <strong>${datos.ivaR.toLocaleString(undefined, {minimumFractionDigits:2})}</strong></div>
            <div style={s.miniDato}><span>ISR R:</span> <strong>${datos.isrR.toLocaleString(undefined, {minimumFractionDigits:2})}</strong></div>
        </div>
    </div>
);

const obtenerTotales = (lista) => {
    return lista.reduce((acc, i) => {
        const k = i.clasificacion === 'autorizado' ? 'aut' : i.clasificacion === 'no_autorizado' ? 'noAut' : null;
        if (k) { acc[k].sub += i.subtotal; acc[k].ivaT += (i.ivaT || 0); acc[k].ivaR += i.ivaR; acc[k].isrR += i.isrR; }
        return acc;
    }, { aut: { sub: 0, ivaT: 0, ivaR: 0, isrR: 0 }, noAut: { sub: 0, ivaT: 0, ivaR: 0, isrR: 0 } });
};

const s = {
    container: { padding: '40px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f4f7f6' },
    header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' },
    btnBack: { padding: '12px 28px', cursor: 'pointer', borderRadius: '12px', border: 'none', backgroundColor: '#455a64', color: '#fff', fontWeight: '700' },
    btnPdf: { padding: '12px 28px', cursor: 'pointer', borderRadius: '12px', border: 'none', backgroundColor: '#2e7d32', color: '#fff', fontWeight: '700' },
    uploadBox: { background: '#fff', padding: '35px', borderRadius: '15px', marginBottom: '40px', textAlign: 'center', border: '3px dashed #2196F3' },
    errorBox: { color: '#d32f2f', marginBottom: '20px', padding: '15px', background: '#fdecea', borderRadius: '8px', borderLeft: '5px solid #d32f2f' },
    seccion: { background: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 6px 15px rgba(0,0,0,0.1)', marginBottom: '30px' },
    seccionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' },
    rowMiniResumen: { display: 'flex', gap: '25px' },
    cardResumenFull: { padding: '15px 25px', background: '#f8f9fa', borderRadius: '10px', minWidth: '380px', display: 'flex', gap: '25px', alignItems: 'center' },
    resumenPrincipal: { borderRight: '2px solid #ddd', paddingRight: '25px' },
    resumenDetalle: { display: 'flex', flexDirection: 'column', gap: '5px' },
    miniDato: { fontSize: '15px', display: 'flex', justifyContent: 'space-between', width: '160px' },
    labelMini: { fontSize: '12px', color: '#888', fontWeight: 'bold' },
    valorMini: { fontSize: '22px', fontWeight: 'bold' },
    tableScroll: { overflowX: 'auto', maxHeight: '700px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '16px', tableLayout: 'fixed' },
    thRow: { background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 5 },
    th: { padding: '15px', textAlign: 'left', borderBottom: '4px solid #eee', fontWeight: 'bold' },
    td: { padding: '15px', borderBottom: '1px solid #eee', verticalAlign: 'top' },
    tdSmall: { padding: '15px', borderBottom: '1px solid #eee', fontSize: '15px' },
    tdImportes: { padding: '15px 25px 15px 15px', borderBottom: '1px solid #eee', textAlign: 'right' },
    btnGroup: { display: 'flex', gap: '15px', justifyContent: 'center' },
    btnRound: { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #ddd', cursor: 'pointer', fontSize: '20px' },
    montoPrincipal: { fontWeight: 'bold', fontSize: '18px', color: '#000' },
    montoIvaT: { color: '#2e7d32', fontWeight: '600', fontSize: '14px' },
    montoIvaR: { color: '#c62828', fontWeight: '600', fontSize: '14px' },
    montoIsrR: { color: '#f57c00', fontWeight: '600', fontSize: '14px' },
    descTwoLines: { display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '14px' },
    tr: { transition: '0.2s' }
};

export default AuditoriaXML;