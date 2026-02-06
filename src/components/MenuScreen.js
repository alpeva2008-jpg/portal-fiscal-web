import React from 'react';
import { FaReceipt, FaFileInvoice, FaIdCard, FaChartBar, FaFileAlt, FaMoneyCheckAlt, FaUserShield } from 'react-icons/fa';

const MenuScreen = ({ onLogout, onNavigate, showAdminBtn, modulosActivos }) => {
    // LÓGICA INTACTA: Solo cambiamos los valores de color a una paleta Azul Sideral
    const allMenuItems = [
        { label: "Facturas", icon: <FaReceipt />, color: "linear-gradient(135deg, #4b6cb7 0%, #182848 100%)", target: "facturas", id: "facturas" },
        { label: "Declaraciones", icon: <FaFileInvoice />, color: "linear-gradient(135deg, #2c3e50 0%, #000000 100%)", target: "declaraciones", id: "declaraciones" },
        { label: "Constancia", icon: <FaIdCard />, color: "linear-gradient(135deg, #373b44 0%, #4286f4 100%)", target: "constancia", id: "constancia" },
        { label: "Opinión 32D", icon: <FaChartBar />, color: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", target: "opinion32d", id: "opinion32d" },
        { label: "Facturación", icon: <FaFileAlt />, color: "linear-gradient(135deg, #61a0af 0%, #203541 100%)", target: "facturacion", id: "facturacion" },
        { label: "Pago Honorarios", icon: <FaMoneyCheckAlt />, color: "linear-gradient(135deg, #485563 0%, #29323c 100%)", target: "honorarios", id: "honorarios" },
    ];

    const menuItems = showAdminBtn 
        ? allMenuItems 
        : (modulosActivos 
            ? allMenuItems.filter(item => modulosActivos[item.id] !== false)
            : allMenuItems);

    return (
        <div style={styles.container}>
            <div style={styles.decorCircle1}></div>
            <div style={styles.decorCircle2}></div>

            <div style={styles.card}>
                <div style={{ marginBottom: '20px' }}>
                    <img src="/logo_despacho.png" alt="Logo" style={styles.logo} />
                </div>
                
                <h2 style={styles.title}>Portal de Clientes</h2>
                
                <div style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <button 
                            key={index} 
                            onClick={() => onNavigate(item.target)} 
                            style={{ 
                                ...styles.menuButton, 
                                background: item.color 
                            }}
                        >
                            <span style={styles.icon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}

                    {showAdminBtn && (
                        <button 
                            onClick={() => onNavigate('admin')} 
                            style={styles.adminButton}
                        >
                            <FaUserShield /> <span style={{ marginLeft: '10px' }}>PANEL ADMINISTRADOR</span>
                        </button>
                    )}
                </div>

                <button onClick={onLogout} style={styles.logoutButton}>Cerrar Sesión</button>
            </div>
        </div>
    );
};

const styles = {
    container: { 
        display: 'flex', 
        minHeight: '100vh', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Segoe UI, Roboto, sans-serif'
    },
    decorCircle1: {
        position: 'absolute', top: '-5%', left: '-5%', width: '350px', height: '350px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
    },
    decorCircle2: {
        position: 'absolute', bottom: '-5%', right: '-5%', width: '250px', height: '250px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
    },
    card: { 
        backgroundColor: 'rgba(15, 32, 39, 0.8)', // Un gris azulado más profundo
        backdropFilter: 'blur(20px) saturate(160%)',
        padding: '40px', 
        borderRadius: '32px', 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)', 
        maxWidth: '380px', 
        width: '100%', 
        textAlign: 'center',
        zIndex: 1
    },
    logo: { width: '160px', filter: 'brightness(1.1) drop-shadow(0 4px 10px rgba(0,0,0,0.4))' },
    title: { color: '#ffffff', fontSize: '20px', fontWeight: '700', marginBottom: '25px', letterSpacing: '0.5px', textTransform: 'uppercase' },
    grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    menuButton: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', // CENTRADO
        padding: '16px', 
        color: '#e0e0e0', 
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px', 
        cursor: 'pointer', 
        fontWeight: '600', 
        fontSize: '15px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease'
    },
    icon: { marginRight: '12px', fontSize: '18px', display: 'flex', alignItems: 'center' },
    adminButton: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '14px'
    },
    logoutButton: { 
        marginTop: '30px', width: '100%', padding: '12px', backgroundColor: 'transparent', 
        color: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.2)', 
        borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '500'
    }
};

export default MenuScreen;