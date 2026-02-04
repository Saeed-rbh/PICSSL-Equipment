import LabCalendar from '@/components/LabCalendar';
import Navbar from '@/components/Navbar';

export default function CalendarPage() {
    return (
        <>
            <Navbar />
            <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <h1 className="title-gradient" style={{ marginBottom: '0.5rem' }}>Lab Schedule</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Check instrument availability and current reservations.
                </p>
                <LabCalendar />
            </main>
        </>
    );
}
