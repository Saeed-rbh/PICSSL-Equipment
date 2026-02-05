'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function AdminDashboard({ reservations: initialReservations, trainingRequests: initialTraining, analysisRequests: initialAnalysis, accessLogs: initialLogs }) {

    const [activeTab, setActiveTab] = useState('reservations');
    const [reservations, setReservations] = useState(initialReservations);
    const [trainingRequests, setTrainingRequests] = useState(initialTraining);
    const [analysisRequests, setAnalysisRequests] = useState(initialAnalysis);
    const [accessLogs, setAccessLogs] = useState(initialLogs || []);
    const [selectedItem, setSelectedItem] = useState(null); // For Details Modal

    const [schedulingItem, setSchedulingItem] = useState(null); // For Schedule Modal

    const tabs = [
        { id: 'reservations', label: 'Instrument Reservations' },
        { id: 'training', label: 'Training Requests' },
        { id: 'analysis', label: 'Analysis Requests' },
        { id: 'logs', label: 'Access Logs' },
    ];

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        // Handle Firestore Timestamp or Date string
        const date = new Date(timestamp._seconds ? timestamp._seconds * 1000 : timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const handleDelete = async (collection, id) => {
        if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

        try {
            const response = await fetch('/api/admin/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collection, id })
            });

            if (response.ok) {
                // Update Local State
                if (collection === 'reservations') setReservations(reservations.filter(item => item.id !== id));
                if (collection === 'training_requests') setTrainingRequests(trainingRequests.filter(item => item.id !== id));
                if (collection === 'analysis_requests') setAnalysisRequests(analysisRequests.filter(item => item.id !== id));
            } else {
                alert('Failed to delete record.');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting record.');
        }
    };

    const handleClearLogs = async () => {
        if (!window.confirm('WARNING: Are you sure you want to DELETE ALL LOGS? This cannot be undone.')) return;

        try {
            const response = await fetch('/api/admin/clear-logs', { method: 'POST' });
            if (response.ok) {
                setAccessLogs([]); // Clear local state
                alert('All logs have been cleared.');
            } else {
                alert('Failed to clear logs.');
            }
        } catch (error) {
            console.error(error);
            alert('Error clearing logs.');
        }
    };

    // Calculate Totals
    const totalReservationsCost = reservations.reduce((acc, curr) => acc + (parseFloat(curr.totalCost) || 0), 0);
    const totalAnalysisCost = analysisRequests.reduce((acc, curr) => acc + (parseFloat(curr.estimatedCost) || 0), 0);
    const totalTrainingCost = trainingRequests.length * 250; // Fixed $250 fee
    const grandTotal = totalReservationsCost + totalAnalysisCost + totalTrainingCost;

    return (
        <>
            <Navbar />
            <main className="container" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
                <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Admin Dashboard</h1>

                {/* Summary Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Revenue</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>${grandTotal.toLocaleString()}</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Reservations Value</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${totalReservationsCost.toLocaleString()}</p>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{reservations.length} bookings</span>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Analysis Value</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${totalAnalysisCost.toLocaleString()}</p>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{analysisRequests.length} requests</span>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Training Value</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${totalTrainingCost.toLocaleString()}</p>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{trainingRequests.length} requests</span>
                    </div>
                </div>

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

                    {activeTab === 'logs' && (
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleClearLogs}
                                style={{
                                    background: '#da3633',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Clear All Logs
                            </button>
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    {activeTab !== 'logs' && <th style={{ padding: '1rem', textAlign: 'left' }}>Date Submitted</th>}
                                    {activeTab !== 'logs' && <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>}

                                    {activeTab === 'reservations' && <th style={{ padding: '1rem', textAlign: 'left' }}>Reserved Date</th>}
                                    {activeTab === 'reservations' && <th style={{ padding: '1rem', textAlign: 'left' }}>Time Slots</th>}
                                    {activeTab !== 'logs' && <th style={{ padding: '1rem', textAlign: 'left' }}>Est. Cost</th>}

                                    {activeTab === 'reservations' && <th style={{ padding: '1rem', textAlign: 'left' }}>Actual Time</th>}
                                    {activeTab === 'reservations' && <th style={{ padding: '1rem', textAlign: 'left' }}>Final Price</th>}
                                    {activeTab === 'analysis' && <th style={{ padding: '1rem', textAlign: 'left' }}>Samples</th>}
                                    {activeTab === 'analysis' && <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>}
                                    {activeTab === 'training' && <th style={{ padding: '1rem', textAlign: 'left' }}>Department</th>}

                                    {activeTab === 'logs' && <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>}
                                    {activeTab === 'logs' && <th style={{ padding: '1rem', textAlign: 'left' }}>Login Time</th>}
                                    {activeTab === 'logs' && <th style={{ padding: '1rem', textAlign: 'left' }}>Logout Time</th>}
                                    {activeTab === 'logs' && <th style={{ padding: '1rem', textAlign: 'left' }}>Duration</th>}

                                    {activeTab !== 'reservations' && activeTab !== 'logs' && <th style={{ padding: '1rem', textAlign: 'left' }}>Supervisor</th>}
                                    {activeTab !== 'logs' && <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === 'reservations' && reservations.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{formatDate(item.createdAt)}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.fullName}</td>
                                        <td style={{ padding: '1rem' }}>{new Date(item.selectedDate).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>{item.selectedSlots?.join(', ')}</td>
                                        <td style={{ padding: '1rem', color: 'var(--accent-primary)' }}>${item.totalCost}</td>
                                        {/* New Columns for Actual Usage */}
                                        <td style={{ padding: '1rem' }}>
                                            {item.actualDuration ? (
                                                <span style={{ color: '#2ea043', fontWeight: 'bold' }}>{Math.round(item.actualDuration)} mins</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {item.finalCost !== undefined ? (
                                                <span style={{ color: '#2ea043', fontWeight: 'bold' }}>${item.finalCost}</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => setSelectedItem(item)} style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>View</button>
                                                <button onClick={() => handleDelete('reservations', item.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {activeTab === 'analysis' && analysisRequests.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{formatDate(item.createdAt)}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.fullName}</td>
                                        <td style={{ padding: '1rem' }}>{item.email}</td>
                                        <td style={{ padding: '1rem', color: 'var(--accent-primary)' }}>${item.estimatedCost}</td>
                                        <td style={{ padding: '1rem' }}>{item.sampleCount}</td>
                                        <td style={{ padding: '1rem' }}>{item.analysisType}</td>
                                        <td style={{ padding: '1rem' }}>{item.supervisorEmail}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => setSelectedItem(item)} style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>View</button>
                                                <button onClick={() => setSchedulingItem({ collection: 'analysis_requests', ...item })} style={{ padding: '0.25rem 0.5rem', background: 'rgba(46, 160, 67, 0.15)', border: '1px solid rgba(46, 160, 67, 0.3)', borderRadius: '4px', cursor: 'pointer', color: '#2ea043' }}>Schedule</button>
                                                <button onClick={() => handleDelete('analysis_requests', item.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {activeTab === 'training' && trainingRequests.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{formatDate(item.createdAt)}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.fullName}</td>
                                        <td style={{ padding: '1rem' }}>{item.email}</td>
                                        <td style={{ padding: '1rem' }}>$250</td>
                                        <td style={{ padding: '1rem' }}>{item.department}</td>
                                        <td style={{ padding: '1rem' }}>{item.supervisor}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => setSelectedItem(item)} style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>View</button>
                                                <button onClick={() => setSchedulingItem({ collection: 'training_requests', ...item })} style={{ padding: '0.25rem 0.5rem', background: 'rgba(46, 160, 67, 0.15)', border: '1px solid rgba(46, 160, 67, 0.3)', borderRadius: '4px', cursor: 'pointer', color: '#2ea043' }}>Schedule</button>
                                                <button onClick={() => handleDelete('training_requests', item.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {activeTab === 'logs' && accessLogs.map((item, i) => {
                                    const logoutTime = new Date(item.timestamp);
                                    const loginTime = new Date(logoutTime.getTime() - (item.durationMinutes * 60000));

                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                                {item.fullName}
                                                {item.userType === 'admin' && <span style={{ marginLeft: '10px', fontSize: '0.8rem', background: '#2ea043', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span>}
                                            </td>
                                            <td style={{ padding: '1rem' }}>{loginTime.toLocaleString()}</td>
                                            <td style={{ padding: '1rem' }}>{logoutTime.toLocaleString()}</td>
                                            <td style={{ padding: '1rem' }}>{Math.round(item.durationMinutes)} mins</td>
                                            {/* Empty actions cell to align with header if needed, but header has logic to hide actions for logs */}
                                        </tr>
                                    );
                                })}

                                {((activeTab === 'reservations' && reservations.length === 0) ||
                                    (activeTab === 'analysis' && analysisRequests.length === 0) ||
                                    (activeTab === 'training' && trainingRequests.length === 0)) && (
                                        <tr>
                                            <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No records found.
                                            </td>
                                        </tr>
                                    )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {selectedItem && <DetailsModal item={selectedItem} logs={accessLogs} onClose={() => setSelectedItem(null)} formatDate={formatDate} />}
                {schedulingItem && <ScheduleModal item={schedulingItem} onClose={() => setSchedulingItem(null)} />}
            </main >
        </>
    );
}

// Simple Modal using inline styles for speed
function DetailsModal({ item, logs, onClose, formatDate }) {
    if (!item) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card-animate" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Request Details</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>&times;</button>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {Object.entries(item).map(([key, value]) => {
                        // Skip internal/complex fields if needed, or format them
                        if (key === 'createdAt' || key === 'selectedDate' || key === 'scheduledDate') value = formatDate(value);
                        if (key === 'selectedSlots' && Array.isArray(value)) value = value.join(', ');
                        if (typeof value === 'object' && value !== null) return null; // Skip complex objects for now

                        return (
                            <div key={key} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 2fr', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>{String(value)}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Session History Section */}
                {logs && logs.length > 0 && item.collection === undefined && (
                    // item.collection is undefined for reservations in current structure, or check if item has 'finalCost'
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Session History</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-secondary)' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Login Time</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Logout Time</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Duration</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Session Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.filter(log => log.reservationId === item.id).length > 0 ? (
                                        logs.filter(log => log.reservationId === item.id).map((log, i) => {
                                            const logoutTime = new Date(log.timestamp);
                                            const loginTime = new Date(logoutTime.getTime() - (log.durationMinutes * 60000));
                                            return (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '0.5rem' }}>{loginTime.toLocaleString()}</td>
                                                    <td style={{ padding: '0.5rem' }}>{logoutTime.toLocaleString()}</td>
                                                    <td style={{ padding: '0.5rem' }}>{Math.round(log.durationMinutes)} mins</td>
                                                    <td style={{ padding: '0.5rem' }}>${log.finalCost || 0}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No usage recorded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer' }}>Close</button>
                </div>
            </div>
        </div>
    );
}


function ScheduleModal({ item, onClose }) {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(`${date}T${endTime}`);

        if (endDateTime <= startDateTime) {
            alert('End time must be after start time.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/admin/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collection: item.collection,
                    id: item.id,
                    scheduleDate: startDateTime.toISOString(),
                    scheduleEndDate: endDateTime.toISOString(),
                    notes: notes
                })
            });

            if (response.ok) {
                alert('Scheduled successfully! Confirmation sent.');
                window.location.reload();
                onClose();
            } else {
                alert('Failed to schedule.');
            }
        } catch (error) {
            console.error(error);
            alert('Error scheduling.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card-animate" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '400px', width: '100%' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Schedule {item.collection === 'training_requests' ? 'Training' : 'Analysis'}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date</label>
                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Start Time</label>
                            <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>End Time</label>
                            <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions, room number, etc..." style={{ width: '100%', padding: '0.5rem', height: '80px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }} disabled={loading}>Cancel</button>
                        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer' }}>{loading ? 'Scheduling...' : 'Confirm Schedule'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

