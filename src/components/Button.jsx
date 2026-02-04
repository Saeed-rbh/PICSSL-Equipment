export default function Button({ children, variant = 'primary', onClick, href, className = '' }) {
    const baseStyle = {
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: variant === 'primary' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
        color: variant === 'primary' ? '#fff' : 'var(--text-primary)',
        boxShadow: variant === 'primary' ? '0 0 15px var(--accent-glow)' : 'none',
    };

    if (href) {
        return (
            <a href={href} style={baseStyle} className={className}>
                {children}
            </a>
        );
    }

    return (
        <button style={baseStyle} onClick={onClick} className={className}>
            {children}
        </button>
    );
}
