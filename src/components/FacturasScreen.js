import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

function FacturasScreen({ onBack }) {
  const [facturaList, setFacturaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacturas = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Consultamos la colección "facturas" por userId (Igual que en Android)
          const q = query(collection(db, "facturas"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setFacturaList(docs);
        }
      } catch (error) {
        console.error("Error al cargar facturas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacturas();
  }, []);

  // Función para iPhone y limpieza de links de Google Drive
  const formatLink = (url) => {
    if (!url) return "#";
    return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
  };

  return (
    <div style={s.container}>
      <button onClick={onBack} style={s.btnBack}>← Regresar</button>
      
      <h2 style={s.title}>Mis Facturas</h2>

      {loading ? (
        <p style={s.msg}>Cargando facturas...</p>
      ) : facturaList.length > 0 ? (
        <div style={s.listContainer}>
          {facturaList.map((factura) => (
            <div key={factura.id} style={s.card}>
              <div style={s.cardHeader}>
                <span style={{ fontSize: '24px', color: '#4CAF50' }}>🧾</span>
                <div style={s.pdfName}>{factura.name || "Sin nombre"}</div>
              </div>
              
              <div style={s.buttonGroup}>
                {/* Botón PDF (Azul) */}
                {factura.pdfUrl && (
                  <a 
                    href={formatLink(factura.pdfUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <button style={s.btnPdf}>PDF</button>
                  </a>
                )}

                {/* Botón XML (Naranja) */}
                {factura.xmlUrl && (
                  <a 
                    href={factura.xmlUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <button style={s.btnXml}>XML</button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={s.msg}>No hay facturas disponibles</p>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
  title: { textAlign: 'center', color: '#333', marginBottom: '25px', borderBottom: '2px solid #4CAF50', paddingBottom: '10px' },
  btnBack: { marginBottom: '20px', padding: '10px 15px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { 
    backgroundColor: '#DFF0D8', // Verde claro igual a Android
    padding: '16px', 
    borderRadius: '12px', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  pdfName: { fontSize: '16px', fontWeight: 'bold', color: '#3c763d' },
  buttonGroup: { display: 'flex', gap: '8px' },
  btnPdf: { 
    backgroundColor: '#2196F3', // Azul para PDF
    color: 'white', 
    border: 'none', 
    padding: '8px 20px', 
    borderRadius: '5px', 
    fontWeight: 'bold', 
    cursor: 'pointer' 
  },
  btnXml: { 
    backgroundColor: '#FF9800', // Naranja para XML
    color: 'white', 
    border: 'none', 
    padding: '8px 20px', 
    borderRadius: '5px', 
    fontWeight: 'bold', 
    cursor: 'pointer' 
  },
  msg: { textAlign: 'center', color: '#888', fontSize: '16px' }
};

export default FacturasScreen;