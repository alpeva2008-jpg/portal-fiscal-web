import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

function ConstanciaScreen({ onBack }) {
  const [csfList, setCsfList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCsf = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Consultamos la colección "csf" filtrando por el userId (Igual que en Android)
          const q = query(collection(db, "csf"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setCsfList(docs);
        }
      } catch (error) {
        console.error("Error al cargar Constancias:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCsf();
  }, []);

  // Función para compatibilidad con iPhone y limpieza de links de Drive
  const formatLink = (url) => {
    if (!url) return "#";
    return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
  };

  return (
    <div style={s.container}>
      <button onClick={onBack} style={s.btnBack}>← Regresar</button>
      
      <h2 style={s.title}>Constancia de Situación Fiscal</h2>

      {loading ? (
        <p style={s.msg}>Cargando constancias...</p>
      ) : csfList.length > 0 ? (
        <div style={s.listContainer}>
          {csfList.map((csf) => (
            <div key={csf.id} style={s.card}>
              <div style={s.cardInfo}>
                <span style={{ fontSize: '24px', color: '#9C27B0' }}>📄</span>
                <div style={s.pdfName}>{csf.name || "Sin nombre"}</div>
              </div>
              
              {/* Usamos el campo pdfUrl que definiste en Android */}
              <a 
                href={formatLink(csf.pdfUrl)} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <button style={s.btnPdf}>PDF</button>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={s.msg}>No hay constancias disponibles</p>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
  title: { textAlign: 'center', color: '#333', marginBottom: '25px', borderBottom: '2px solid #9C27B0', paddingBottom: '10px' },
  btnBack: { marginBottom: '20px', padding: '10px 15px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#E3F2FD', // Azul de fondo igual a Android
    padding: '16px', 
    borderRadius: '12px', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
  },
  cardInfo: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  pdfName: { fontSize: '16px', fontWeight: '500', color: '#333' },
  btnPdf: { 
    backgroundColor: '#9C27B0', // Morado igual que tu botón en Kotlin
    color: 'white', 
    border: 'none', 
    padding: '8px 16px', 
    borderRadius: '5px', 
    fontWeight: 'bold', 
    cursor: 'pointer' 
  },
  msg: { textAlign: 'center', color: '#888', fontSize: '16px' }
};

export default ConstanciaScreen;