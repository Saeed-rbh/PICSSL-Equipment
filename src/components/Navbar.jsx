export default function Navbar() {
    const navStyle = {
        padding: '1rem 0',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(5, 5, 5, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    };

    const containerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 var(--spacing-md)',
    };

    const logoStyle = {
        fontWeight: 'bold',
        fontSize: '1.5rem',
        letterSpacing: '-0.05em',
        display: 'flex',
        alignItems: 'center',
    };

    const linkStyle = {
        marginLeft: '2rem',
        color: 'var(--text-secondary)',
        transition: 'color 0.2s',
    };

    return (
        <nav style={navStyle}>
            <div style={containerStyle}>
                <div style={logoStyle}>
                    <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)', fontSize: '1rem', marginRight: '0.5rem' }}>PICSSL Lab /</span>
                    OPTIR<span style={{ color: 'var(--accent-primary)' }}>.</span>
                </div>
                <div>
                    <a href="/" style={{ ...linkStyle, color: 'var(--text-primary)' }}>Home</a>
                    <a href="/calendar" style={linkStyle}>Calendar</a>
                    <a href="/reservation" style={linkStyle}>Reserve Instrument</a>
                    <a href="/sample-request" style={linkStyle}>Request Analysis</a>
                    <a href="/training" style={linkStyle}>Training</a>
                    <a href="/about" style={linkStyle}>About</a>
                </div>
            </div>
        </nav>
    );
}
