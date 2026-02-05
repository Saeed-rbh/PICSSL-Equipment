'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function TrainingPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        department: '',
        supervisor: '',
        supervisorEmail: '',
        costCenter: '',
        availability: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'training', // New flag to distinguish request type
                    ...formData
                }),
            });

            if (res.ok) {
                setSubmitted(true);
                // Do not clear formData so we can show the email
            } else {
                alert("Failed to submit request to server.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem', maxWidth: '600px' }}>
                {submitted ? (
                    <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(46, 160, 67, 0.15)', color: '#2ea043', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>Request Received!</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                            Thank you for requesting training on the OPTIR system. We have received your details and sent a confirmation email to <strong>{formData.email || 'your inbox'}</strong>.
                            <br /><br />
                            We will review your request and contact you shortly to schedule your session.
                        </p>
                        <Button href="/">Return Home</Button>
                    </div>
                ) : (
                    <>
                        <h1 className="title-gradient" style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>Request Training</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Get certified to use the OPTIR system. Training takes approximately 2-3 hours and covers safety, sample prep, and software operation.
                        </p>

                        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                            <Input
                                label="Full Name"
                                placeholder="Jane Doe"
                                required
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="jane@university.edu"
                                required
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <Input
                                label="Department / Lab"
                                placeholder="Materials Science, Lab 304"
                                required
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                            />
                            <Input
                                label="Supervisor Name"
                                placeholder="Dr. Smith"
                                required
                                name="supervisor"
                                value={formData.supervisor}
                                onChange={handleChange}
                            />
                            <Input
                                label="Supervisor Email"
                                type="email"
                                placeholder="supervisor@university.edu"
                                required
                                name="supervisorEmail"
                                value={formData.supervisorEmail}
                                onChange={handleChange}
                            />

                            <div style={{ marginTop: '2rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Payment / Cost</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Training Fee:</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>$250 CAD</span>
                                </div>
                                <Input
                                    label="Cost Center (if applicable)"
                                    placeholder="e.g. 123-456-789"
                                    name="costCenter"
                                    value={formData.costCenter}
                                    onChange={handleChange}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Time Availability / Preference</label>
                                <textarea
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minHeight: '80px', fontFamily: 'inherit' }}
                                    placeholder="e.g. Mon/Wed mornings, or next week anytime"
                                    required
                                    name="availability"
                                    value={formData.availability}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                                <Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Submit Request'}</Button>
                            </div>
                        </form>
                    </>
                )}
            </main>
        </>
    );
}
