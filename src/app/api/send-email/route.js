import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import * as ics from 'ics';

export async function POST(request) {
    try {
        const body = await request.json();
        const { fullName, email, supervisor, supervisorEmail, sampleName, selectedDate, selectedSlots, totalCost } = body;

        // 1. Create ICS Event
        // Parse date "YYYY-MM-DDT..."
        const dateObj = new Date(selectedDate);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();

        // Get start hour from first slot (e.g., "09:00")
        const startHour = parseInt(selectedSlots[0].split(':')[0]);
        const durationHours = selectedSlots.length; // Assuming contiguous 1-hour slots

        const event = {
            start: [year, month, day, startHour, 0],
            duration: { hours: durationHours, minutes: 0 },
            title: `OPTIR Reservation: ${fullName}`,
            description: `Reservation Details:\nUser: ${fullName} (${email})\nSupervisor: ${supervisor} (${supervisorEmail})\nSample: ${sampleName}\nTotal Cost: $${totalCost}\n\nInstrument: Optical Photothermal IR Spectroscopy`,
            location: 'PICSSL Lab, York University',
            url: 'http://picssl.yorku.ca',
            geo: { lat: 43.7735, lon: -79.5019 },
            categories: ['Lab Reservation', 'Scientific'],
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: 'OPTIR System', email: 'reservations@picssl.yorku.ca' },
            attendees: [
                { name: fullName, email: email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
                { name: supervisor, email: supervisorEmail, role: 'OPT-PARTICIPANT' }
            ]
        };

        const { error, value } = ics.createEvent(event);
        if (error) {
            console.error('ICS Generation Error:', error);
            return NextResponse.json({ message: 'Error generating calendar invite' }, { status: 500 });
        }

        // 2. Configure Transporter
        // NOTE: In production, use real credentials from process.env
        // For this demo, we will use Ethereal (fake SMTP) OR simply log if no creds are present.

        let transporter;
        if (process.env.SMTP_HOST) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            // Mock Transporter
            console.log("---------------------------------------------------");
            console.log("MOCK EMAIL SENDING (No SMTP Credentials provided)");
            console.log(`To: ${email}, ${supervisorEmail}, reservations@picssl.yorku.ca, rizvi@yorku.ca`);
            console.log(`Subject: Confirmation: OPTIR Reservation ${selectedDate}`);
            console.log("Body:", event.description);
            console.log("Attachment: reservation.ics generated successfully.");
            console.log("---------------------------------------------------");

            // Return success immediately for mock
            return NextResponse.json({ message: 'Mock email logged to console', success: true });
        }

        // 3. Send Email
        const info = await transporter.sendMail({
            from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>', // sender address
            to: [email, supervisorEmail, "reservations@picssl.yorku.ca", "rizvi@yorku.ca"], // list of receivers
            subject: `Confirmation: OPTIR Reservation - ${selectedDate.split('T')[0]}`, // Subject line
            text: `Your reservation has been confirmed.\n\n${event.description}\n\nPlease find the calendar invite attached.`, // plain text body
            icalEvent: {
                filename: 'reservation.ics',
                method: 'request',
                content: value
            }
        });

        console.log("Message sent: %s", info.messageId);
        return NextResponse.json({ message: 'Email sent successfully', messageId: info.messageId });

    } catch (error) {
        console.error('Email API Error:', error);
        return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
    }
}
