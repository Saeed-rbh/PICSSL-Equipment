'use client';

import { useState } from 'react';

export default function LabCalendar() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(null);

    // Mock Data
    const reservations = [
        { date: '2026-02-15', time: '09:00', user: 'Dr. Smith' },
        { date: '2026-02-15', time: '10:00', user: 'Dr. Smith' },
        { date: '2026-02-15', time: '11:00', user: 'Dr. Smith' },
        { date: '2026-02-16', time: '14:00', user: 'Jane Doe' },
        { date: '2026-02-16', time: '15:00', user: 'Jane Doe' },
        { date: '2026-02-20', time: '09:00', user: 'Operator Maintenance' },
        { date: '2026-02-20', time: '10:00', user: 'Operator Maintenance' },
        { date: '2026-02-20', time: '11:00', user: 'Operator Maintenance' },
        { date: '2026-02-20', time: '12:00', user: 'Operator Maintenance' },
        { date: '2026-02-20', time: '13:00', user: 'Operator Maintenance' },
    ];

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const changeMonth = (offset) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
        setSelectedDate(null);
    };

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getReservationsForDate = (date) => {
        const dateString = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format mostly
        // Simple string match for this mock
        // Let's standardise on constructing the string manually to match mock data format 'YYYY-MM-DD'
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const searchStr = `${year}-${month}-${day}`;

        return reservations.filter(r => r.date === searchStr);
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }}></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            const dateReservations = getReservationsForDate(date);
            const hasReservation = dateReservations.length > 0;
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);

            days.push(
                <div
                    key={day}
                    onClick={() => !isWeekend && setSelectedDate(date)}
                    style={{
                        padding: '0.5rem',
                        minHeight: '80px',
                        border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: isWeekend ? 'not-allowed' : 'pointer',
                        background: isSelected ? 'rgba(47, 129, 247, 0.1)' : (isWeekend ? 'var(--bg-secondary)' : 'var(--bg-card)'),
                        position: 'relative',
                        transition: 'all 0.2s',
                        opacity: isWeekend ? 0.5 : 1
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem',
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)'
                    }}>
                        {day}
                    </div>
                    {isWeekend ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                            Closed
                        </div>
                    ) : hasReservation && (
                        <div style={{ fontSize: '0.75rem' }}>
                            <div style={{
                                background: 'rgba(210, 153, 34, 0.2)',
                                color: '#d29922',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginBottom: '2px'
                            }}>
                                {dateReservations.length} Booked
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* Calendar Side */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => changeMonth(-1)}
                            style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                            &lt; Prev
                        </button>
                        <button
                            onClick={() => changeMonth(1)}
                            style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                            Next &gt;
                        </button>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)'
                }}>
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                    {renderCalendar()}
                </div>
            </div>

            {/* Details Side Panel */}
            <div className="card-animate" style={{
                background: 'var(--bg-secondary)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                height: 'fit-content'
            }}>
                <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a Date'}
                </h3>

                {selectedDate ? (
                    <div>
                        {getReservationsForDate(selectedDate).length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {getReservationsForDate(selectedDate).map((res, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        background: 'var(--bg-card)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: '4px solid var(--accent-primary)'
                                    }}>
                                        <span style={{ fontWeight: 'bold' }}>{res.time}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{res.user}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                                <p>No reservations for this date.</p>
                                <div style={{
                                    display: 'inline-block',
                                    marginTop: '1rem',
                                    padding: '4px 12px',
                                    background: 'rgba(46, 160, 67, 0.15)',
                                    color: '#3fb950',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem'
                                }}>
                                    All Slots Available
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>Click on a date in the calendar to view detailed reservation schedule.</p>
                )}
            </div>
        </div>
    );
}
