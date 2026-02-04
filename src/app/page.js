import Navbar from '@/components/Navbar';
import Button from '@/components/Button';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '4rem' }}>
        <div style={{ maxWidth: '800px' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            color: 'var(--accent-primary)'
          }}>
            <span style={{ width: '8px', height: '8px', background: '#2ea043', borderRadius: '50%', display: 'inline-block', marginRight: '8px' }}></span>
            System Operational
          </div>

          <h1 className="title-gradient" style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Advanced Molecular <br /> Fingerprinting.
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '2.5rem', maxWidth: '600px' }}>
            Book your session on the Optical Photothermal IR Spectroscopy system.
            High-resolution chemical mapping for your research.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button href="/reservation">Reserve Instrument</Button>
            <Button variant="secondary" href="/sample-request">Request Sample Test</Button>
            <Button variant="secondary" href="/training" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Training</Button>
          </div>
        </div>

        {/* Decorative Grid Background - Simple CSS implementation */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          backgroundImage: 'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.05,
          pointerEvents: 'none'
        }}></div>
      </main>
    </>
  );
}
