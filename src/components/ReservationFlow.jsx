'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import Input from './Input';

export default function ReservationFlow() {
    const [step, setStep] = useState('screening'); // screening, selection, sample-details, calendar
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState([]); // Array of times
    const [formData, setFormData] = useState({
        isTrained: null,
        serviceType: null, // 'self' or 'operator'
        fullName: '',
        email: '',
        department: '',
        supervisor: '',
        supervisorEmail: '',
        sampleName: '',
        sampleType: '',
        hazards: '',
        costCenter: '',
        requestOperator: false,
        isPicsslGroup: false,
    });

    // Helper to get days in month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper to get first day of month (0-6)
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const toggleSlot = (time) => {
        if (selectedSlots.includes(time)) {
            setSelectedSlots(selectedSlots.filter(t => t !== time));
        } else {
            setSelectedSlots([...selectedSlots, time].sort());
        }
    };

    const calculateTotal = () => {
        if (formData.isPicsslGroup) return 0;

        const hours = selectedSlots.length;
        const instrumentRate = 50;
        const operatorRate = 40;

        const instrumentTotal = Math.min(hours * instrumentRate, 250); // Cap at $250
        const operatorTotal = formData.requestOperator ? (hours * operatorRate) : 0;

        return instrumentTotal + operatorTotal;
    };

    const handleScreening = (isTrained) => {
        setFormData({ ...formData, isTrained });
        if (!isTrained) {
            // Logic handled in render
        } else {
            setFormData({ ...formData, isTrained, serviceType: 'self' });
            setStep('sample-details');
        }
    };

    const handleSelection = (type) => {
        setFormData({ ...formData, serviceType: type });
        if (type === 'operator') {
            window.location.href = '/sample-request'; // Redirect strictly for demo
        } else {
            setStep('sample-details');
        }
    };

    const handleSampleSubmit = (e) => {
        e.preventDefault();
        setStep('calendar');
    };

    // Generate calendar days
    const renderCalendarMonth = (offset = 0) => {
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth() + offset, 1);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        // Empty slots for start of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }}></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isPast = date < new Date(today.setHours(0, 0, 0, 0));
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isDisabled = isPast || isWeekend;

            days.push(
                <div
                    key={day}
                    onClick={() => {
                        if (!isDisabled) {
                            setSelectedDate(date);
                            setSelectedSlots([]); // Reset slots on new date selection
                        }
                    }}
                    style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--accent-primary)' : (isWeekend ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                        color: isSelected ? '#fff' : (isDisabled ? 'var(--text-tertiary)' : 'var(--text-primary)'),
                        opacity: isDisabled ? 0.3 : 1,
                        fontSize: '0.9rem'
                    }}
                    onMouseOver={(e) => !isDisabled && !isSelected && (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseOut={(e) => !isDisabled && !isSelected && (e.currentTarget.style.background = 'transparent')}
                >
                    {day}
                </div>
            );
        }

        return (
            <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1rem' }}>
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                    {days}
                </div>
            </div>
        );
    };

    // --- RENDER STEPS ---

    if (step === 'screening') {
        return (
            <div className="card-animate">
                <h2 style={{ marginBottom: '1.5rem' }}>First, are you trained on the OPTIR system?</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={() => handleScreening(true)}>Yes, I am trained</Button>
                    <Button variant="secondary" onClick={() => setFormData({ ...formData, isTrained: false })}>No, I am not trained</Button>
                </div>

                {formData.isTrained === false && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255, 0, 85, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-secondary)' }}>
                        <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>Training Required</h3>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>You must be trained to operate the instrument yourself. You can request training or request an operator to run the sample for you.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button href="/training">Request Training</Button>
                            <Button variant="secondary" href="/sample-request">Request Operator</Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (step === 'selection') {
        return (
            <div className="card-animate">
                <h2 style={{ marginBottom: '1.5rem' }}>How would you like to proceed?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div
                        onClick={() => handleSelection('self')}
                        style={{
                            padding: '2rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            background: 'var(--bg-secondary)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    >
                        <h3 style={{ marginBottom: '0.5rem' }}>Reserve Time</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>I will run the sample myself.</p>
                    </div>

                    <div
                        onClick={() => handleSelection('operator')}
                        style={{
                            padding: '2rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            background: 'var(--bg-secondary)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    >
                        <h3 style={{ marginBottom: '0.5rem' }}>Request Sample Test</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>I want an operator to run it.</p>
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                    <Button variant="secondary" onClick={() => setStep('screening')}>Back</Button>
                </div>
            </div>
        );
    }

    if (step === 'sample-details') {
        return (
            <div className="card-animate">
                <h2 style={{ marginBottom: '1.5rem' }}>Reservation Details</h2>
                <form onSubmit={handleSampleSubmit}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Contact Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Input
                            label="Full Name"
                            placeholder="Jane Doe"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="jane@yorku.ca"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Input
                            label="Department / University"
                            placeholder="e.g. Chemistry, York U"
                            required
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        />
                        <Input
                            label="Supervisor Name"
                            placeholder="Dr. Smith"
                            required
                            value={formData.supervisor}
                            onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                        />
                        <Input
                            label="Supervisor Email"
                            type="email"
                            placeholder="supervisor@university.edu"
                            required
                            value={formData.supervisorEmail}
                            onChange={(e) => setFormData({ ...formData, supervisorEmail: e.target.value })}
                        />
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Sample Information</h3>
                    <Input
                        label="Sample Name / ID"
                        placeholder="e.g. Polymer Blend 5X"
                        required
                        value={formData.sampleName}
                        onChange={(e) => setFormData({ ...formData, sampleName: e.target.value })}
                    />
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>State</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                            value={formData.sampleType}
                            onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                            required
                        >
                            <option value="">Select...</option>
                            <option value="solid">Solid</option>
                            <option value="liquid">Liquid</option>
                            <option value="powder">Powder</option>
                            <option value="biological">Biological Cell/Tissue</option>
                        </select>
                    </div>
                    <Input
                        label="Hazards (if any)"
                        placeholder="e.g. Toxic, Flammable"
                        value={formData.hazards}
                        onChange={(e) => setFormData({ ...formData, hazards: e.target.value })}
                    />

                    <div style={{ marginTop: '2rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Payment / Cost</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Instrument Rate:</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>$50 CAD / hour</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                * Daily cap of $250 CAD (5 hours). Operator assistance adds $40 CAD/hr.
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <input
                                type="checkbox"
                                id="isPicsslGroup"
                                checked={formData.isPicsslGroup}
                                onChange={(e) => setFormData({ ...formData, isPicsslGroup: e.target.checked })}
                                style={{ marginTop: '0.25rem' }}
                            />
                            <div>
                                <label htmlFor="isPicsslGroup" style={{ display: 'block', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>
                                    I am a member of the PICSSL Group
                                </label>
                                {formData.isPicsslGroup && (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                                        Booking is free for PICSSL group members.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <input
                                type="checkbox"
                                id="requestOperator"
                                checked={formData.requestOperator}
                                onChange={(e) => setFormData({ ...formData, requestOperator: e.target.checked })}
                                style={{ marginTop: '0.25rem' }}
                            />
                            <div>
                                <label htmlFor="requestOperator" style={{ display: 'block', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>
                                    Request Operator Assistance (+$40 CAD/hr)
                                </label>
                                {formData.requestOperator && (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                                        Note: An operator will connect with you to confirm details.
                                    </p>
                                )}
                            </div>
                        </div>

                        <Input
                            label="Cost Center (if applicable)"
                            placeholder="e.g. 123-456-789"
                            value={formData.costCenter}
                            onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <Button type="submit">Continue to Calendar</Button>
                        <Button variant="secondary" onClick={() => setStep('selection')} type="button">Back</Button>
                    </div>
                </form>
            </div>
        );
    }

    if (step === 'calendar') {
        const totalCost = calculateTotal();

        return (
            <div className="card-animate">
                <h2 style={{ marginBottom: '1rem' }}>Select Date & Time</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {renderCalendarMonth(0)}
                    {renderCalendarMonth(1)}
                </div>

                {selectedDate && (
                    <div className="card-animate" style={{ marginTop: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Available Slots for {selectedDate.toLocaleDateString()}</h3>
                        <AvailabilityPicker selectedDate={selectedDate} selectedSlots={selectedSlots} toggleSlot={toggleSlot} />
                    </div>
                )}


                {selectedDate && selectedSlots.length > 0 && (
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Reservation Summary</h3>
                        <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <li><strong>Date:</strong> {selectedDate.toLocaleDateString()}</li>
                            <li><strong>Time(s):</strong> {selectedSlots.join(', ')} ({selectedSlots.length} hours)</li>
                            <li><strong>Estimated Cost:</strong> <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>${totalCost} CAD</span></li>
                            <li><strong>Sample:</strong> {formData.sampleName} ({formData.sampleType})</li>
                            <li><strong>Contact:</strong> {formData.fullName}</li>
                        </ul>
                        <div style={{ marginTop: '1rem' }}>
                            <Button onClick={async () => {
                                const btn = document.activeElement;
                                const originalText = btn.innerText;
                                btn.innerText = 'Processing...';
                                btn.disabled = true;

                                try {
                                    const response = await fetch('/api/send-email', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            fullName: formData.fullName,
                                            email: formData.email,
                                            supervisor: formData.supervisor,
                                            supervisorEmail: formData.supervisorEmail,
                                            sampleName: formData.sampleName,
                                            selectedDate: selectedDate,
                                            selectedSlots: selectedSlots,
                                            totalCost: totalCost,
                                            isPicsslGroup: formData.isPicsslGroup,
                                            type: 'reservation'
                                        })
                                    });

                                    if (response.ok) {
                                        setStep('success');
                                    } else {
                                        alert('Reservation saved locally, but failed to send email confirmation.');
                                    }
                                } catch (err) {
                                    console.error(err);
                                    alert('Error processing reservation.');
                                } finally {
                                    btn.innerText = originalText;
                                    btn.disabled = false;
                                }
                            }}>Confirm Reservation</Button>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '1.5rem' }}>
                    <Button variant="secondary" onClick={() => setStep('sample-details')}>Back</Button>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="card-animate" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(46, 160, 67, 0.15)', color: '#2ea043', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>Reservation Confirmed!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                    Your reservation for <strong>{selectedDate?.toLocaleDateString()}</strong> has been confirmed.
                    <br />
                    We have sent a calendar invite and confirmation details to <strong>{formData.email}</strong>.
                </p>
                <Button href="/calendar">View Calendar</Button>
            </div>
        );
    }

    return <div>Unknown Step</div>;
}

function AvailabilityPicker({ selectedDate, selectedSlots, toggleSlot }) {
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/calendar');
                const data = await res.json();
                if (data.success) {
                    // Filter for selected date
                    const dateStr = selectedDate.toLocaleDateString(); // Needs to match how we save/compare
                    // Robust comparison using YYYY-MM-DD
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    const targetStr = `${year}-${month}-${day}`;

                    const taken = data.data
                        .filter(r => r.date && r.date.startsWith(targetStr))
                        .flatMap(r => r.time);

                    setBookedSlots(taken);
                }
            } catch (error) {
                console.error('Failed to fetch availability', error);
            } finally {
                setLoading(false);
            }
        };

        if (selectedDate) fetchAvailability();
    }, [selectedDate]);

    const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

    if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Checking availability...</div>;

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                {allSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    const isSelected = selectedSlots.includes(time);
                    return (
                        <div key={time}
                            onClick={() => !isBooked && toggleSlot(time)}
                            style={{
                                padding: '0.75rem',
                                border: `1px solid ${isSelected ? 'var(--accent-primary)' : (isBooked ? 'var(--border-color)' : 'var(--border-color)')}`,
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                background: isBooked ? 'rgba(0,0,0,0.2)' : (isSelected ? 'rgba(47, 129, 247, 0.1)' : 'var(--bg-secondary)'),
                                color: isBooked ? 'var(--text-tertiary)' : (isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'),
                                transition: 'all 0.2s',
                                textDecoration: isBooked ? 'line-through' : 'none',
                                opacity: isBooked ? 0.6 : 1
                            }}
                            title={isBooked ? 'Already reserved' : 'Available'}
                        >
                            {time}
                        </div>
                    );
                })}
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Select multiple slots if needed. Rate: $50/hr (Capped at $250/day).
            </p>
        </div>
    );
}
