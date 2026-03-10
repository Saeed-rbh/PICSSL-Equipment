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
    const [memberFilter, setMemberFilter] = useState('all'); // 'all', 'lab_member', 'non_lab_member'
    const [monthFilter, setMonthFilter] = useState('all'); // 'all' or 'YYYY-MM'
    const [creationModalOpen, setCreationModalOpen] = useState(false);

    // Compute available months for the filter dropdown based on reservations
    const availableMonths = Array.from(new Set(reservations.map(r => {
        if (!r.selectedDate) return null;
        const d = new Date(r.selectedDate);
        if (isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).filter(Boolean))).sort().reverse().map(value => {
        const [year, month] = value.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        return { value, label: date.toLocaleString('default', { month: 'long', year: 'numeric' }) };
    });

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
        return date.toLocaleDateString();
    };

    const formatTimeSlots = (slots) => {
        if (!slots || !Array.isArray(slots) || slots.length === 0) return '';
        const sortedSlots = [...slots].sort((a, b) => parseInt(a) - parseInt(b));
        let ranges = [];
        let startSlot = sortedSlots[0];
        let endSlot = sortedSlots[0];

        for (let i = 1; i < sortedSlots.length; i++) {
            const prevHour = parseInt(endSlot);
            const currHour = parseInt(sortedSlots[i]);

            if (currHour === prevHour + 1) {
                endSlot = sortedSlots[i];
            } else {
                const endHourStr = (parseInt(endSlot) + 1).toString().padStart(2, '0') + ':00';
                ranges.push(`${startSlot}-${endHourStr}`);
                startSlot = sortedSlots[i];
                endSlot = sortedSlots[i];
            }
        }

        const endHourStr = (parseInt(endSlot) + 1).toString().padStart(2, '0') + ':00';
        ranges.push(`${startSlot}-${endHourStr}`);
        return ranges.join(', ');
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

    const filteredReservations = reservations.filter(r => {
        let memberMatch = true;
        if (memberFilter === 'lab_member') memberMatch = r.isPicsslGroup === true || r.picsslGroup === true;
        if (memberFilter === 'non_lab_member') memberMatch = !r.isPicsslGroup && !r.picsslGroup;

        let monthMatch = true;
        if (monthFilter !== 'all' && r.selectedDate) {
            const d = new Date(r.selectedDate);
            if (!isNaN(d.getTime())) {
                const rMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthMatch = rMonth === monthFilter;
            }
        }

        return memberMatch && monthMatch;
    });

    const handleDownloadCSV = () => {
        let dataToExport = [];
        let filename = '';

        if (activeTab === 'reservations') {
            dataToExport = filteredReservations.map(r => ({
                'Date Submitted': formatDate(r.createdAt).split(' ')[0],
                'Name': r.fullName,
                'Email': r.email,
                'Supervisor': r.supervisor || '-',
                'Reserved Date': new Date(r.selectedDate).toLocaleDateString(),
                'Time Slots': formatTimeSlots(r.selectedSlots),
                'Est. Cost': r.totalCost,
                'Actual Time': r.actualDuration ? Math.round(r.actualDuration) + ' mins' : '-',
                'Final Price': r.finalCost !== undefined ? r.finalCost : '-',
                'Cost Center': r.costCenter || '-'
            }));
            filename = 'reservations.csv';
        } else if (activeTab === 'analysis') {
            dataToExport = analysisRequests.map(r => ({
                'Date Submitted': formatDate(r.createdAt).split(' ')[0],
                'Name': r.fullName,
                'Email': r.email,
                'Est. Cost': r.estimatedCost,
                'Samples': r.sampleCount,
                'Type': r.analysisType,
                'Supervisor': r.supervisorEmail
            }));
            filename = 'analysis_requests.csv';
        } else if (activeTab === 'training') {
            dataToExport = trainingRequests.map(r => ({
                'Date Submitted': formatDate(r.createdAt).split(' ')[0],
                'Name': r.fullName,
                'Email': r.email,
                'Est. Cost': 250,
                'Department': r.department,
                'Supervisor': r.supervisor
            }));
            filename = 'training_requests.csv';
        } else if (activeTab === 'logs') {
            dataToExport = accessLogs.map(l => {
                const logoutTime = new Date(l.timestamp);
                const loginTime = new Date(logoutTime.getTime() - (l.durationMinutes * 60000));
                return {
                    'Name': l.fullName,
                    'User Type': l.userType === 'admin' ? 'ADMIN' : 'USER',
                    'Login Time': loginTime.toLocaleString(),
                    'Logout Time': logoutTime.toLocaleString(),
                    'Duration': Math.round(l.durationMinutes) + ' mins'
                };
            });
            filename = 'access_logs.csv';
        }

        if (!dataToExport || dataToExport.length === 0) {
            alert('No data to export.');
            return;
        }

        const headers = Object.keys(dataToExport[0]);
        const csvRows = [];
        csvRows.push(headers.map(h => `"${h}"`).join(','));

        for (const row of dataToExport) {
            const values = headers.map(header => {
                const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
                const escaped = String(val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvData = csvRows.join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Calculate Totals
    const totalReservationsCost = filteredReservations.reduce((acc, curr) => acc + (parseFloat(curr.totalCost) || 0), 0);
    const totalAnalysisCost = analysisRequests.reduce((acc, curr) => acc + (parseFloat(curr.estimatedCost) || 0), 0);
    const totalTrainingCost = trainingRequests.length * 250; // Fixed $250 fee
    const grandTotal = totalReservationsCost + totalAnalysisCost + totalTrainingCost;

    return (
        <>
            <Navbar />
            <main className="container admin-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: 0 }}>Admin Dashboard</h1>
                </div>

                {/* Summary Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Revenue</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>${grandTotal.toLocaleString()}</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Reservations Value</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${totalReservationsCost.toLocaleString()}</p>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{filteredReservations.length} bookings</span>
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
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', paddingBottom: '0.5rem' }}>
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
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>

                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <button
                            onClick={handleDownloadCSV}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Export to CSV
                        </button>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {activeTab === 'reservations' && (
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <select
                                        value={monthFilter}
                                        onChange={(e) => setMonthFilter(e.target.value)}
                                        style={{
                                            appearance: 'none',
                                            WebkitAppearance: 'none',
                                            padding: '0.45rem 2rem 0.45rem 1rem',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        <option value="all">🗓️ All Months</option>
                                        {availableMonths.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                    <svg
                                        style={{ position: 'absolute', right: '0.5rem', pointerEvents: 'none', color: 'var(--text-secondary)' }}
                                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            )}

                            {activeTab === 'reservations' && (
                                <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    {[
                                        { value: 'all', label: 'All' },
                                        { value: 'lab_member', label: 'PICSSL Members' },
                                        { value: 'non_lab_member', label: 'Non-Members' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setMemberFilter(opt.value)}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                background: memberFilter === opt.value ? 'var(--accent-primary)' : 'transparent',
                                                color: memberFilter === opt.value ? 'white' : 'var(--text-primary)',
                                                border: 'none',
                                                borderRight: opt.value !== 'non_lab_member' ? '1px solid var(--border-color)' : 'none',
                                                cursor: 'pointer',
                                                fontWeight: memberFilter === opt.value ? 'bold' : 'normal',
                                                transition: 'background 0.2s',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'analysis' && (
                                <button
                                    onClick={() => setCreationModalOpen('analysis')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    + Create Analysis Request
                                </button>
                            )}

                            {activeTab === 'training' && (
                                <button
                                    onClick={() => setCreationModalOpen('training')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    + Create Training Request
                                </button>
                            )}

                            {activeTab === 'logs' && (
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
                            )}
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="desktop-only">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    {activeTab !== 'logs' && <th>Date Submitted</th>}
                                    {activeTab !== 'logs' && <th>Name</th>}
                                    {(activeTab === 'analysis' || activeTab === 'training') && <th>Email</th>}

                                    {activeTab === 'reservations' && <th>Reserved Date</th>}
                                    {activeTab === 'reservations' && <th>Time Slots</th>}
                                    {activeTab !== 'logs' && <th>Est. Cost</th>}

                                    {activeTab === 'reservations' && <th>Actual Time</th>}
                                    {activeTab === 'reservations' && <th>Final Price</th>}
                                    {activeTab === 'analysis' && <th>Samples</th>}
                                    {activeTab === 'analysis' && <th>Type</th>}
                                    {activeTab === 'training' && <th>Department</th>}

                                    {activeTab === 'logs' && <th>Name</th>}
                                    {activeTab === 'logs' && <th>Login Time</th>}
                                    {activeTab === 'logs' && <th>Logout Time</th>}
                                    {activeTab === 'logs' && <th>Duration</th>}

                                    {activeTab !== 'reservations' && activeTab !== 'logs' && <th>Supervisor</th>}
                                    {activeTab !== 'logs' && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === 'reservations' && filteredReservations.map((item, i) => (
                                    <tr key={i}>
                                        <td>{formatDate(item.createdAt)}</td>
                                        <td style={{ fontWeight: 'bold' }}>{item.fullName}</td>
                                        <td>{new Date(item.selectedDate).toLocaleDateString()}</td>
                                        <td>{formatTimeSlots(item.selectedSlots)}</td>
                                        <td style={{ color: 'var(--accent-primary)' }}>${item.totalCost}</td>
                                        <td>
                                            {item.actualDuration ? (
                                                <span style={{ color: '#2ea043', fontWeight: 'bold' }}>{Math.round(item.actualDuration)} mins</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {item.finalCost !== undefined ? (
                                                <span style={{ color: '#2ea043', fontWeight: 'bold' }}>${item.finalCost}</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => setSelectedItem(item)} style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>View</button>
                                                <button onClick={() => handleDelete('reservations', item.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {activeTab === 'analysis' && analysisRequests.map((item, i) => (
                                    <tr key={i}>
                                        <td>{formatDate(item.createdAt)}</td>
                                        <td style={{ fontWeight: 'bold' }}>{item.fullName}</td>
                                        <td>{item.email}</td>
                                        <td style={{ color: 'var(--accent-primary)' }}>${item.estimatedCost}</td>
                                        <td>{item.sampleCount}</td>
                                        <td>{item.analysisType}</td>
                                        <td>{item.supervisorEmail}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => setSelectedItem(item)} style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>View</button>
                                                <button onClick={() => setSchedulingItem({ collection: 'analysis_requests', ...item })} style={{ padding: '0.25rem 0.5rem', background: 'rgba(46, 160, 67, 0.15)', border: '1px solid rgba(46, 160, 67, 0.3)', borderRadius: '4px', cursor: 'pointer', color: '#2ea043' }}>Schedule</button>
                                                <button onClick={() => handleDelete('analysis_requests', item.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {activeTab === 'training' && trainingRequests.map((item, i) => (
                                    <tr key={i}>
                                        <td>{formatDate(item.createdAt)}</td>
                                        <td style={{ fontWeight: 'bold' }}>{item.fullName}</td>
                                        <td>{item.email}</td>
                                        <td>$250</td>
                                        <td>{item.department}</td>
                                        <td>{item.supervisor}</td>
                                        <td>
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
                                        <tr key={i}>
                                            <td style={{ fontWeight: 'bold' }}>
                                                {item.fullName}
                                                {item.userType === 'admin' && <span style={{ marginLeft: '10px', fontSize: '0.8rem', background: '#2ea043', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span>}
                                            </td>
                                            <td>{loginTime.toLocaleString()}</td>
                                            <td>{logoutTime.toLocaleString()}</td>
                                            <td>{Math.round(item.durationMinutes)} mins</td>
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

                    {/* Mobile Card View */}
                    <div className="mobile-only" style={{ padding: '1rem' }}>
                        {activeTab === 'reservations' && filteredReservations.map((item, i) => (
                            <div key={i} className="dashboard-card">
                                <div className="dashboard-card-row">
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.fullName}</span>
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>${item.totalCost}</span>
                                </div>
                                <div className="dashboard-card-row">
                                    <span className="dashboard-card-label">Date:</span>
                                    <span>{new Date(item.selectedDate).toLocaleDateString()}</span>
                                </div>
                                <div className="dashboard-card-row">
                                    <span className="dashboard-card-label">Slots:</span>
                                    <span>{formatTimeSlots(item.selectedSlots)}</span>
                                </div>
                                {item.actualDuration && (
                                    <div className="dashboard-card-row">
                                        <span className="dashboard-card-label">Actual Usage:</span>
                                        <span style={{ color: '#2ea043' }}>{Math.round(item.actualDuration)} mins (${item.finalCost})</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setSelectedItem(item)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)', flex: 1 }}>View Details</button>
                                    <button onClick={() => handleDelete('reservations', item.id)} style={{ padding: '0.5rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Delete</button>
                                </div>
                            </div>
                        ))}

                        {activeTab === 'analysis' && analysisRequests.map((item, i) => (
                            <div key={i} className="dashboard-card">
                                <div className="dashboard-card-row">
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.fullName}</span>
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>${item.estimatedCost}</span>
                                </div>
                                <div className="dashboard-card-row">
                                    <span className="dashboard-card-label">Samples:</span>
                                    <span>{item.sampleCount}</span>
                                </div>
                                <div className="dashboard-card-row" style={{ alignItems: 'flex-start' }}>
                                    <span className="dashboard-card-label">Type:</span>
                                    <span style={{ textAlign: 'right', maxWidth: '60%' }}>{item.analysisType}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button onClick={() => setSelectedItem(item)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)', flex: 1 }}>View</button>
                                    <button onClick={() => setSchedulingItem({ collection: 'analysis_requests', ...item })} style={{ padding: '0.5rem 1rem', background: 'rgba(46, 160, 67, 0.15)', border: '1px solid rgba(46, 160, 67, 0.3)', borderRadius: '4px', cursor: 'pointer', color: '#2ea043', flex: 1 }}>Schedule</button>
                                    <button onClick={() => handleDelete('analysis_requests', item.id)} style={{ padding: '0.5rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Delete</button>
                                </div>
                            </div>
                        ))}

                        {activeTab === 'training' && trainingRequests.map((item, i) => (
                            <div key={i} className="dashboard-card">
                                <div className="dashboard-card-row">
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.fullName}</span>
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>$250</span>
                                </div>
                                <div className="dashboard-card-row">
                                    <span className="dashboard-card-label">Department:</span>
                                    <span>{item.department}</span>
                                </div>
                                <div className="dashboard-card-row">
                                    <span className="dashboard-card-label">Supervisor:</span>
                                    <span>{item.supervisor}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button onClick={() => setSelectedItem(item)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)', flex: 1 }}>View</button>
                                    <button onClick={() => setSchedulingItem({ collection: 'training_requests', ...item })} style={{ padding: '0.5rem 1rem', background: 'rgba(46, 160, 67, 0.15)', border: '1px solid rgba(46, 160, 67, 0.3)', borderRadius: '4px', cursor: 'pointer', color: '#2ea043', flex: 1 }}>Schedule</button>
                                    <button onClick={() => handleDelete('training_requests', item.id)} style={{ padding: '0.5rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Delete</button>
                                </div>
                            </div>
                        ))}

                        {activeTab === 'logs' && accessLogs.map((item, i) => {
                            const logoutTime = new Date(item.timestamp);
                            const loginTime = new Date(logoutTime.getTime() - (item.durationMinutes * 60000));
                            return (
                                <div key={i} className="dashboard-card">
                                    <div className="dashboard-card-row">
                                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.fullName}</span>
                                        {item.userType === 'admin' && <span style={{ fontSize: '0.7rem', background: '#2ea043', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span>}
                                    </div>
                                    <div className="dashboard-card-row">
                                        <span className="dashboard-card-label">Duration:</span>
                                        <span>{Math.round(item.durationMinutes)} mins</span>
                                    </div>
                                    <div className="dashboard-card-row">
                                        <span className="dashboard-card-label">Log:</span>
                                        <span style={{ fontSize: '0.8rem' }}>{loginTime.toLocaleTimeString()} - {logoutTime.toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {((activeTab === 'reservations' && filteredReservations.length === 0) ||
                            (activeTab === 'analysis' && analysisRequests.length === 0) ||
                            (activeTab === 'training' && trainingRequests.length === 0)) && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No records found.
                                </div>
                            )}
                    </div>
                </div>


                {selectedItem && <DetailsModal item={selectedItem} logs={accessLogs} onClose={() => setSelectedItem(null)} formatDate={formatDate} formatTimeSlots={formatTimeSlots} />}
                {schedulingItem && <ScheduleModal item={schedulingItem} onClose={() => setSchedulingItem(null)} />}
                {creationModalOpen && <CreateRequestModal initialType={creationModalOpen} onClose={() => setCreationModalOpen(false)} />}
            </main >
        </>
    );
}

// Simple Modal using inline styles for speed
function DetailsModal({ item, logs, onClose, formatDate, formatTimeSlots }) {
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
                        if (key === 'selectedSlots' && Array.isArray(value)) value = formatTimeSlots(value);
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

function CreateRequestModal({ onClose, initialType }) {
    const [type, setType] = useState(initialType || 'training'); // 'training' or 'analysis'
    const [loading, setLoading] = useState(false);

    // Common Fields
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        supervisor: '',
        supervisorEmail: '',
        scheduleDate: '',
        startTime: '',
        endTime: '',
        notes: '',
        // Training Specific
        department: '',
        costCenter: '',
        trainee2Name: '',
        trainee2Email: '',
        availability: '',
        // Analysis Specific
        institution: '',
        sampleCount: 1,
        sampleDescription: '',
        analysisType: '',
        estimatedCost: 100,
        deliveryMethod: 'I will drop them off at the Lab'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/admin/create-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, ...formData })
            });

            if (response.ok) {
                alert('Request created and scheduled successfully!');
                window.location.reload();
                onClose();
            } else {
                alert('Failed to create request.');
            }
        } catch (error) {
            console.error(error);
            alert('Error processing request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card-animate" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', padding: '0.25rem', lineHeight: '1', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    type="button"
                >
                    ✕
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>Create {type === 'training' ? 'Training' : 'Sample Analysis'} Request</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Applicant Info</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <input placeholder="Full Name" name="fullName" required value={formData.fullName} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                            <input placeholder="Email" name="email" type="email" required value={formData.email} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <input placeholder="Supervisor Name" name="supervisor" value={formData.supervisor} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                            <input placeholder="Supervisor Email" name="supervisorEmail" type="email" required value={formData.supervisorEmail} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                        </div>

                        {type === 'training' && (
                            <>
                                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Training Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                    <input placeholder="Department" name="department" required value={formData.department} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                                    <input placeholder="Cost Center" name="costCenter" value={formData.costCenter} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Trainee 2 (Optional)</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                        <input placeholder="Name" name="trainee2Name" value={formData.trainee2Name} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                                        <input placeholder="Email" name="trainee2Email" type="email" value={formData.trainee2Email} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Time Availability / Preference</label>
                                    <textarea
                                        placeholder="e.g. Mon/Wed mornings, or next week anytime"
                                        name="availability"
                                        required
                                        value={formData.availability}
                                        onChange={handleChange}
                                        style={{ padding: '0.5rem', width: '100%', height: '60px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', fontFamily: 'inherit' }}
                                    />
                                </div>
                            </>
                        )}

                        {type === 'analysis' && (
                            <>
                                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Analysis Details</h3>
                                <input placeholder="Institution" name="institution" required value={formData.institution} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Number of Samples</label>
                                    <input type="number" name="sampleCount" min="1" required value={formData.sampleCount} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sample Description</label>
                                    <input placeholder="Briefly describe composition" name="sampleDescription" required value={formData.sampleDescription} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Desired Analysis</label>
                                    <textarea
                                        placeholder="What are you looking for? (e.g. chemical mapping of interface)"
                                        name="analysisType"
                                        required
                                        value={formData.analysisType}
                                        onChange={handleChange}
                                        style={{ padding: '0.5rem', width: '100%', height: '80px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Estimated Cost</label>
                                    <input type="number" name="estimatedCost" required value={formData.estimatedCost} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cost Center (if applicable)</label>
                                    <input placeholder="e.g. 123-456-789" name="costCenter" value={formData.costCenter} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>How will you get the samples to us?</label>
                                    <select
                                        name="deliveryMethod"
                                        value={formData.deliveryMethod}
                                        onChange={handleChange}
                                        style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                    >
                                        <option>I will drop them off at the Lab</option>
                                        <option>I will ship them via courier</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Schedule & Confirmation</h3>
                        <input type="date" name="scheduleDate" required value={formData.scheduleDate} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <input type="time" name="startTime" required value={formData.startTime} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                            <input type="time" name="endTime" required value={formData.endTime} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                        </div>
                        <textarea placeholder="Admin Notes (included in email)" name="notes" value={formData.notes} onChange={handleChange} style={{ padding: '0.5rem', width: '100%', height: '60px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }} disabled={loading}>Cancel</button>
                        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer' }}>{loading ? 'Processing...' : 'Create & Schedule'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

