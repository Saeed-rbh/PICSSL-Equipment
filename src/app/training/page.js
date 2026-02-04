'use client';

import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function TrainingPage() {
    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Request Received! We will contact you shortly to schedule your training session.");
    };

    return (
        <>
            <Navbar />
            <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '600px' }}>
                <h1 className="title-gradient" style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>Request Training</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Get certified to use the OPTIR system. Training takes approximately 2-3 hours and covers safety, sample prep, and software operation.
                </p>

                <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <Input label="Full Name" placeholder="Jane Doe" required />
                    <Input label="Email" type="email" placeholder="jane@university.edu" required />
                    <Input label="Department / Lab" placeholder="Materials Science, Lab 304" required />
                    <Input label="Supervisor Name" placeholder="Dr. Smith" required />

                    <div style={{ marginTop: '2rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Payment / Cost</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Training Fee:</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>$250 CAD</span>
                        </div>
                        <Input label="Cost Center (if applicable)" placeholder="e.g. 123-456-789" />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Time Availability / Preference</label>
                        <textarea
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minHeight: '80px', fontFamily: 'inherit' }}
                            placeholder="e.g. Mon/Wed mornings, or next week anytime"
                            required
                        ></textarea>
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                        <Button type="submit">Submit Request</Button>
                    </div>
                </form>
            </main>
        </>
    );
}
