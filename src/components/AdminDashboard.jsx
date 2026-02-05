'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function AdminDashboard({ reservations, trainingRequests, analysisRequests }) {
    const [activeTab, setActiveTab] = useState('reservations');

    const tabs = [
        { id: 'reservations', label: 'Instrument Reservations' },
        { id: 'training', label: 'Training Requests' },
        { id: 'analysis', label: 'Analysis Requests' },
    ];

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        // Handle Firestore Timestamp or Date string
        const date = new Date(timestamp._seconds ? timestamp._seconds * 1000 : timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <>
            <Navbar />
            <main className="container" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
                <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Admin Dashboard</h1>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '1rem 1.5rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date Submitted</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                    {activeTab === 'reservations' && <th style={{ padding: '1rem', textAlign: 'left' }}>Reserved Date</th>}
                                    {activeTab === 'reservations' && <th style={{ padding: '1rem', textAlign: 'left' }}>Time Slots</th>}
                                    {activeTab === 'analysis' && <th style={{ padding: '1rem', textAlign: 'left' }}>Samples</th>}
                                    {activeTab === 'analysis' && <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>}
                                    {activeTab === 'training' && <th style={{ padding: '1rem', textAlign: 'left' }}>Department</th>}
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Supervisor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === 'reservations' && reservations.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{formatDate(item.createdAt)}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.fullName}</td>
                                        <td style={{ padding: '1rem' }}>{item.email}</td>
                                        <td style={{ padding: '1rem' }}>{new Date(item.selectedDate).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>{item.selectedSlots?.join(', ')}</td>
                                        <td style={{ padding: '1rem' }}>{item.supervisor}</td>
                                    </tr>
                                ))}

                                {activeTab === 'analysis' && analysisRequests.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{formatDate(item.createdAt)}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.fullName}</td>
                                        <td style={{ padding: '1rem' }}>{item.email}</td>
                                        <td style={{ padding: '1rem' }}>{item.sampleCount}</td>
                                        <td style={{ padding: '1rem' }}>{item.analysisType}</td>
                                        <td style={{ padding: '1rem' }}>{item.supervisorEmail}</td>
                                    </tr>
                                ))}

                                {activeTab === 'training' && trainingRequests.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{formatDate(item.createdAt)}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.fullName}</td>
                                        <td style={{ padding: '1rem' }}>{item.email}</td>
                                        <td style={{ padding: '1rem' }}>{item.department}</td>
                                        <td style={{ padding: '1rem' }}>{item.supervisor}</td>
                                    </tr>
                                ))}

                                {((activeTab === 'reservations' && reservations.length === 0) ||
                                    (activeTab === 'analysis' && analysisRequests.length === 0) ||
                                    (activeTab === 'training' && trainingRequests.length === 0)) && (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No records found.
                                            </td>
                                        </tr>
                                    )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}
