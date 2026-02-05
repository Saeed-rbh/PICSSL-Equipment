'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

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

    const baseLinkStyle = {
        marginLeft: '2rem',
        transition: 'color 0.2s',
        textDecoration: 'none',
    };

    const getLinkStyle = (path) => {
        const isActive = pathname === path;
        return {
            ...baseLinkStyle,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            opacity: isActive ? 1 : 0.7, // Explicitly setting opacity as requested implies "less opacity" for inactive
        };
    };

    return (
        <nav style={navStyle}>
            <div style={containerStyle}>
                <div style={logoStyle}>
                    <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)', fontSize: '1rem', marginRight: '0.5rem' }}>PICSSL Lab /</span>
                    OPTIR<span style={{ color: 'var(--accent-primary)' }}>.</span>
                </div>
                <div>
                    <Link href="/" style={getLinkStyle('/')}>Home</Link>
                    <Link href="/calendar" style={getLinkStyle('/calendar')}>Calendar</Link>
                    <Link href="/reservation" style={getLinkStyle('/reservation')}>Reserve Instrument</Link>
                    <Link href="/sample-request" style={getLinkStyle('/sample-request')}>Request Analysis</Link>
                    <Link href="/training" style={getLinkStyle('/training')}>Training</Link>
                    <Link href="/about" style={getLinkStyle('/about')}>About</Link>
                    <Link href="/admin" style={{ ...getLinkStyle('/admin'), color: 'var(--accent-primary)', fontWeight: 'bold' }}>Admin</Link>
                </div>
            </div>
        </nav>
    );
}
