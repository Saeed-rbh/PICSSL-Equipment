import Navbar from '@/components/Navbar';
import ReservationFlow from '@/components/ReservationFlow';

export default function ReservationPage() {
    return (
        <>
            <Navbar />
            <main className="container main-section">
                <h1 className="title-gradient" style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem' }}>New Reservation</h1>
                <ReservationFlow />
            </main>
        </>
    );
}
