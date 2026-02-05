import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

function Opinion32DScreen({ onBack }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Consultamos la colección "opinion32d" por userId
          const q = query(collection(db, "opinion32d"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setDocuments(docs);
        }
      } catch (error) {
        console.error("Error al cargar opiniones 32D:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  // Función para compatibilidad con iPhone (Safari)
  const formatLink = (url) => {
    if (!url) return "#";
    return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
  };

  return (
    <div style={s.container}>
      <button onClick={onBack} style={s.btnBack}>← Regresar</button>
      
      <h2 style={s.title}>Opinión de Cumplimiento (32D)</h2>

      {loading ? (
        <p style={s.msg}>Cargando documentos...</p>
      ) : documents.length > 0 ? (
        <div style={s.listContainer}>
          {documents.map((doc) => (
            <div key={doc.id} style={s.card}>
              <div style={s.cardInfo}>
                <span style={{ fontSize: '24px', color: '#FF9800' }}>📊</span>
                <div style={s.pdfName}>{doc.name || "Sin nombre"}</div>
              </div>
              
              <a 
                href={formatLink(doc.pdfUrl)} 
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
          <p style={s.msg}>No hay documentos disponibles</p>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
  title: { textAlign: 'center', color: '#333', marginBottom: '25px', borderBottom: '2px solid #FF9800', paddingBottom: '10px' },
  btnBack: { marginBottom: '20px', padding: '10px 15px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF3E0', // Color crema igual a Android
    padding: '16px', 
    borderRadius: '12px', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
  },
  cardInfo: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' },
  pdfName: { 
    fontSize: '15px', 
    fontWeight: '500', 
    color: '#333',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis' 
  },
  btnPdf: { 
    backgroundColor: '#FF9800', // Naranja igual que tu botón en Kotlin
    color: 'white', 
    border: 'none', 
    padding: '8px 16px', 
    borderRadius: '5px', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    marginLeft: '10px'
  },
  msg: { textAlign: 'center', color: '#888', fontSize: '16px' }
};

export default Opinion32DScreen;