export default function Footer() {
    const footerStyle = {
        padding: '2rem 0',
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
    };

    const containerStyle = {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 var(--spacing-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
    };

    return (
        <footer style={footerStyle}>
            <div style={containerStyle}>
                <div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '0.25rem' }}>PICSSL Lab</p>
                    <p>Polymer and Inorganic Composites, Structures and Surfaces Lab</p>
                    <p>Lassonde School of Engineering, York University</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <a href="https://pixel.lab.yorku.ca/" target="_blank" rel="noopener noreferrer" style={{ marginRight: '1.5rem', textDecoration: 'underline' }}>Lab Website</a>
                    <a href="https://pixel.lab.yorku.ca/research/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Research</a>
                </div>
            </div>
        </footer>
    );
}
