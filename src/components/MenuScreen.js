import React from 'react';
import { FaReceipt, FaFileInvoice, FaIdCard, FaChartBar, FaFileAlt, FaMoneyCheckAlt, FaUserShield } from 'react-icons/fa';

const MenuScreen = ({ onLogout, onNavigate, showAdminBtn, modulosActivos }) => {
    // Definimos todos los ítems posibles
    const allMenuItems = [
        { label: "Facturas", icon: <FaReceipt />, color: "#4CAF50", target: "facturas", id: "facturas" },
        { label: "Declaraciones", icon: <FaFileInvoice />, color: "#2196F3", target: "declaraciones", id: "declaraciones" },
        { label: "Constancia", icon: <FaIdCard />, color: "#9C27B0", target: "constancia", id: "constancia" },
        { label: "Opinión 32D", icon: <FaChartBar />, color: "#FF9800", target: "opinion32d", id: "opinion32d" },
        { label: "Facturación", icon: <FaFileAlt />, color: "#3F51B5", target: "facturacion", id: "facturacion" },
        { label: "Pago Honorarios", icon: <FaMoneyCheckAlt />, color: "#009688", target: "honorarios", id: "honorarios" },
    ];

    // Filtramos los ítems: 
    // Si 'modulosActivos' no existe, mostramos todos por defecto.
    // Si existe, solo mostramos los que estén en 'true'.
    const menuItems = modulosActivos 
        ? allMenuItems.filter(item => modulosActivos[item.id] !== false)
        : allMenuItems;

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={{ marginBottom: '20px' }}>
                    <img 
                        src="/logo_despacho.png" 
                        alt="Logo Despacho" 
                        style={styles.logo} 
                    />
                </div>
                
                <h2 style={styles.title}>Portal de Clientes</h2>
                
                <div style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <button 
                            key={index} 
                            onClick={() => onNavigate(item.target)} 
                            style={{ ...styles.menuButton, backgroundColor: item.color }}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}

                    {showAdminBtn && (
                        <button 
                            onClick={() => onNavigate('admin')} 
                            style={{ ...styles.menuButton, backgroundColor: '#333', marginTop: '10px' }}
                        >
                            <FaUserShield /> PANEL ADMINISTRADOR
                        </button>
                    )}
                </div>

                <button onClick={onLogout} style={styles.logoutButton}>Cerrar Sesión</button>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', padding: '20px' },
    card: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' },
    logo: { width: '180px', height: 'auto', maxWidth: '100%' },
    title: { marginBottom: '25px', color: '#333', fontSize: '20px', fontWeight: 'bold' },
    grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    menuButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
    logoutButton: { marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default MenuScreen;