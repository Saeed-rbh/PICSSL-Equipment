import Navbar from '@/components/Navbar';

export default function AboutPage() {
    return (
        <>
            <Navbar />
            <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '800px' }}>
                <h1 className="title-gradient" style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem' }}>About Us</h1>

                <section style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>PICSSL Lab</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                        The <strong>Polymer and Inorganic Composites, Structures and Surfaces Lab (PICSSL)</strong> is a material science focused group within the Department of Mechanical Engineering at the Lassonde School of Engineering, York University. Led by Dr. Reza Rizvi, our group works with various types of polymer and inorganic materials, focusing on their composites, structures, and surfaces. We leverage industrially scalable synthesis methods to provide solutions for applications in manufacturing, electronics, energy, and health.
                    </p>
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Contact Us</h4>
                        <ul style={{ listStyle: 'none', color: 'var(--text-secondary)' }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Prof. Reza Rizvi:</strong> <a href="mailto:Rrizvi@yorku.ca" style={{ color: 'var(--accent-primary)' }}>Rrizvi@yorku.ca</a>
                            </li>
                            <li>
                                <strong>Equipment Operator (Saeed Arabha):</strong> <a href="mailto:Arabha@yorku.ca" style={{ color: 'var(--accent-primary)' }}>Arabha@yorku.ca</a>
                            </li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>OPTIR System</h2>
                    <div style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Optical Photothermal Infrared Spectroscopy (O-PTIR)</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.7', fontSize: '1.1rem' }}>
                            <strong>The Solution:</strong> O-PTIR uses a collinear visible light source to detect IR absorption, which results in non-contact measurement, thus requiring little or no sample preparation before analysis. Since the light "probe" is used to detect the thermal expansion of the sample, the spatial resolution is independent of infrared light and the submicron infrared spatial resolution is reached.
                        </p>

                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Key Capabilities</h4>
                        <ul style={{ listStyle: 'none', display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
                            {[
                                "Submicron infrared spatial resolution",
                                "Non-contact measurement",
                                "Technique not requiring sample preparation",
                                "Convenience of a contactless reflection technique",
                                "Quality of the FTIR transmission spectra"
                            ].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--accent-primary)', marginRight: '1rem', fontWeight: 'bold' }}>{i + 1}.</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <img src="/optir-resolution.jpg" alt="O-PTIR Resolution vs FTIR" style={{ width: '100%', height: '300px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: '#fff' }} />
                            <img src="/optir-schematic.jpg" alt="O-PTIR Schematic" style={{ width: '100%', height: '300px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: '#fff' }} />
                        </div>

                        <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Best of Both Worlds</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                O-PTIR offers the convenience of a contactless reflection mode technique combined with the quality of FTIR transmission spectra. It allows for spectra collection on thick samples (e.g., 20 µm) with high database match rates for materials like Polystyrene (PS), PET, and PMMA.
                            </p>
                        </div>

                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Equipment Manuals</h4>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <a href="/manuals/mIRage_System_Manual.pdf" download style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                                    <span>📄</span> System Manual
                                </a>
                                <a href="/manuals/mIRage_Software_Manual.pdf" download style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                                    <span>📄</span> Software Manual
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
