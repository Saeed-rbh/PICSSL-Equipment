'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function SampleRequestPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        institution: '',
        supervisorEmail: '',
        sampleDescription: '',
        analysisType: '',
        costCenter: '',
        deliveryMethod: 'I will drop them off at the Lab' // Default first option
    });
    const [sampleCount, setSampleCount] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const estimatedCost = sampleCount * 100;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'analysis',
                    ...formData,
                    sampleCount,
                    estimatedCost
                }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                alert("Failed to submit request.");
            }
        } catch (error) {
            console.error(error);
            alert("Error sending request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="container main-section">
                {submitted ? (
                    <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(46, 160, 67, 0.15)', color: '#2ea043', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>Request Received!</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                            Your sample analysis request has been submitted.
                            <br /><br />
                            Please check your email for <strong>shipping instructions</strong> and next steps.
                        </p>
                        <Button href="/">Return Home</Button>
                    </div>
                ) : (
                    <>
                        <h1 className="title-gradient" style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>Request Sample Test</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Submit samples for our expert operators to test. You can drop them off or ship them to our facility.
                        </p>

                        <form onSubmit={handleSubmit} className="content-card">
                            <h3 style={{ marginBottom: '1rem' }}>Contact Info</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
                                <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <Input label="University / Institution" placeholder="e.g. York University" name="institution" value={formData.institution} onChange={handleChange} required />
                            <Input label="Supervisor Email" type="email" placeholder="supervisor@university.edu" name="supervisorEmail" value={formData.supervisorEmail} onChange={handleChange} required />

                            <h3 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Sample Info</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Number of Samples</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={sampleCount}
                                    onChange={(e) => setSampleCount(parseInt(e.target.value) || 0)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                                    required
                                />
                            </div>
                            <Input label="Sample Description" placeholder="Briefly describe composition" name="sampleDescription" value={formData.sampleDescription} onChange={handleChange} required />
                            <div style={{ marginBottom: '1rem', marginTop: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Desired Analysis</label>
                                <textarea
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minHeight: '100px', fontFamily: 'inherit' }}
                                    placeholder="What are you looking for? (e.g. chemical mapping of interface)"
                                    name="analysisType"
                                    value={formData.analysisType}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <div style={{ marginTop: '2rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Payment / Cost</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Analysis Fee ($100/sample):</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>${estimatedCost} CAD</span>
                                </div>
                                <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    * Additional operator fees ($40/hr) may apply for complex analysis.
                                </div>
                                <Input label="Cost Center (if applicable)" placeholder="e.g. 123-456-789" name="costCenter" value={formData.costCenter} onChange={handleChange} />
                            </div>

                            <h3 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Logistics</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>How will you get the samples to us?</label>
                                <select
                                    name="deliveryMethod"
                                    value={formData.deliveryMethod}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                                >
                                    <option>I will drop them off at the Lab</option>
                                    <option>I will ship them via courier</option>
                                </select>
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(47, 129, 247, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary)', fontSize: '0.9rem' }}>
                                <strong>Shipping Address:</strong><br />
                                Reza Rizvi<br />
                                4700 Keele St<br />
                                Petrie Building Room 002, science store<br />
                                Toronto, Ontario M3J 1P3<br />
                                Canada
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
