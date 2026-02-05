import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

function DeclaracionesScreen({ onBack }) {
  const [pdfList, setPdfList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Consultamos la colección "pdfs" filtrando por el userId (igual que en tu App)
          const q = query(collection(db, "pdfs"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setPdfList(docs);
        }
      } catch (error) {
        console.error("Error al cargar PDFs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPdfs();
  }, []);

  // Función para iPhone y limpieza de links de Drive
  const formatLink = (url) => {
    if (!url) return "#";
    return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
  };

  return (
    <div style={s.container}>
      <button onClick={onBack} style={s.btnBack}>← Regresar</button>
      
      <h2 style={s.title}>Mis Declaraciones</h2>

      {loading ? (
        <p style={s.msg}>Cargando documentos...</p>
      ) : pdfList.length > 0 ? (
        <div style={s.listContainer}>
          {pdfList.map((pdf) => (
            <div key={pdf.id} style={s.card}>
              <div style={s.cardInfo}>
                <span style={s.icon}>📄</span>
                <div style={s.pdfName}>{pdf.name || "Sin nombre"}</div>
              </div>
              
              <a 
                href={formatLink(pdf.url)} 
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
          <p style={s.msg}>No hay declaraciones disponibles</p>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
  title: { textAlign: 'center', color: '#333', marginBottom: '25px', borderBottom: '2px solid #1976d2', paddingBottom: '10px' },
  btnBack: { marginBottom: '20px', padding: '10px 15px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#E3F2FD', // El mismo azul de tu Card en Android
    padding: '16px', 
    borderRadius: '12px', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
  },
  cardInfo: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  icon: { fontSize: '24px' },
  pdfName: { fontSize: '16px', fontWeight: '500', color: '#333' },
  btnPdf: { 
    backgroundColor: '#2196F3', 
    color: 'white', 
    border: 'none', 
    padding: '8px 16px', 
    borderRadius: '5px', 
    fontWeight: 'bold', 
    cursor: 'pointer' 
  },
  msg: { textAlign: 'center', color: '#888', fontSize: '16px' }
};

export default DeclaracionesScreen;