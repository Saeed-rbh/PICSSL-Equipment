import Navbar from '@/components/Navbar';
import Button from '@/components/Button';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container landing-main" style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        <div className="hero-container">
          <div className="hero-content">
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

            <h1 className="title-gradient hero-title">
              mIRage <br /> O-PTIR System.
            </h1>

            <p className="hero-description">
              <strong>Optical Photothermal Infrared Spectroscopy</strong> <br />
              Sub-micron spatial resolution &bull; Non-contact measurement &bull; Simultaneous IR + Raman
            </p>

            <div className="hero-actions">
              <Button href="/reservation">Reserve Instrument</Button>
              <Button variant="secondary" href="/sample-request">Request Sample Test</Button>
              <Button variant="secondary" href="/training" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Training</Button>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <img
              src="/mirage-device.png"
              alt="mIRage OPTIR System"
              className="hero-image"
            />
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
