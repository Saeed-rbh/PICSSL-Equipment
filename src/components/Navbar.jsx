'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const navStyle = {
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)', // Solid background
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
        padding: '1rem var(--spacing-md)',
    };

    const logoStyle = {
        fontWeight: 'bold',
        fontSize: '1.5rem',
        letterSpacing: '-0.05em',
        display: 'flex',
        alignItems: 'center',
    };

    const desktopLinksStyle = {
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
    };

    const mobileMenuOverlayStyle = {
        position: 'fixed',
        top: '60px', // Below navbar height roughly
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--bg-primary)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        zIndex: 99,
        borderTop: '1px solid var(--border-color)',
    };

    const baseLinkStyle = {
        transition: 'color 0.2s',
        textDecoration: 'none',
        fontSize: '0.95rem',
    };

    const getLinkStyle = (path) => {
        const isActive = pathname === path;
        return {
            ...baseLinkStyle,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            opacity: isActive ? 1 : 0.7,
        };
    };

    return (
        <nav style={navStyle}>
            <div style={containerStyle}>
                <Link href="/" style={{ ...logoStyle, textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)', fontSize: '1rem', marginRight: '0.5rem' }}>PICSSL Lab /</span>
                    OPTIR<span style={{ color: 'var(--accent-primary)' }}>.</span>
                </Link>

                {/* Desktop Menu */}
                <div className="desktop-menu">
                    <style jsx>{`
                        .desktop-menu { display: flex; gap: 2rem; align-items: center; }
                        .mobile-toggle { display: none; }
                        @media (max-width: 900px) {
                            .desktop-menu { display: none; }
                            .mobile-toggle { display: block; }
                        }
                    `}</style>
                    <Link href="/" style={getLinkStyle('/')}>Home</Link>
                    <Link href="/calendar" style={getLinkStyle('/calendar')}>Calendar</Link>
                    <Link href="/reservation" style={getLinkStyle('/reservation')}>Reserve Instrument</Link>
                    <Link href="/sample-request" style={getLinkStyle('/sample-request')}>Request Analysis</Link>
                    <Link href="/training" style={getLinkStyle('/training')}>Training</Link>
                    <Link href="/about" style={getLinkStyle('/about')}>About</Link>
                    <Link href="/admin" style={{ ...getLinkStyle('/admin'), color: 'var(--accent-primary)', fontWeight: 'bold' }}>Admin</Link>
                </div>

                {/* Mobile Toggle Button */}
                <button
                    className="mobile-toggle"
                    onClick={toggleMenu}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '1.5rem',
                        padding: '0.5rem',
                        cursor: 'pointer'
                    }}
                >
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div style={mobileMenuOverlayStyle}>
                    <Link href="/" style={getLinkStyle('/')} onClick={toggleMenu}>Home</Link>
                    <Link href="/calendar" style={getLinkStyle('/calendar')} onClick={toggleMenu}>Calendar</Link>
                    <Link href="/reservation" style={getLinkStyle('/reservation')} onClick={toggleMenu}>Reserve Instrument</Link>
                    <Link href="/sample-request" style={getLinkStyle('/sample-request')} onClick={toggleMenu}>Request Analysis</Link>
                    <Link href="/training" style={getLinkStyle('/training')} onClick={toggleMenu}>Training</Link>
                    <Link href="/about" style={getLinkStyle('/about')} onClick={toggleMenu}>About</Link>
                    <Link href="/admin" style={{ ...getLinkStyle('/admin'), color: 'var(--accent-primary)', fontWeight: 'bold' }} onClick={toggleMenu}>Admin</Link>
                </div>
            )}
        </nav>
    );
}
