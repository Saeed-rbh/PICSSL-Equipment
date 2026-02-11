import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import * as ics from 'ics';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req) {
    try {
        const body = await req.json();
        const { collection, id, scheduleDate, scheduleEndDate, notes } = body;

        if (!collection || !id || !scheduleDate || !scheduleEndDate) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const scheduledTime = new Date(scheduleDate);
        const scheduledEndTime = new Date(scheduleEndDate);

        // Calculate duration
        const durationMs = scheduledEndTime - scheduledTime;
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        // 1. Update Firestore
        const apiUsername = `optir-${Math.floor(1000 + Math.random() * 9000)}`;
        const apiPassword = Math.random().toString(36).slice(-8);

        await db.collection(collection).doc(id).update({
            status: 'scheduled',
            scheduledDate: scheduledTime.toISOString(),
            scheduledEndDate: scheduledEndTime.toISOString(),
            adminNotes: notes || '',
            generatedUsername: apiUsername,
            generatedPassword: apiPassword
        });

        // 2. Fetch Document to get Email Details
        const docRef = await db.collection(collection).doc(id).get();
        const data = docRef.data();
        const { fullName, email, trainee2Name, trainee2Email, supervisorEmail, analysisType, department } = data;

        // 3. Send Email
        // Configure Transporter
        const SMTP_HOST = process.env.SMTP_HOST || process.env.smtp_host;
        const SMTP_PORT = process.env.SMTP_PORT || process.env.smtp_port;
        const SMTP_USER = process.env.SMTP_USER || process.env.smtp_user;
        const SMTP_PASS = process.env.SMTP_PASS || process.env.smtp_pass;

        let transporter;
        if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
            transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: parseInt(SMTP_PORT || '587'),
                secure: false,
                auth: { user: SMTP_USER, pass: SMTP_PASS },
            });
        }

        const typeLabel = collection === 'training_requests' ? 'Training Session' : 'Sample Analysis';
        const subject = `Confirmed: OPTIR ${typeLabel} - ${scheduledTime.toLocaleDateString()}`;

        const timeRange = `${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${scheduledEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

        const html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 0;">
            <div style="background-color: ${collection === 'training_requests' ? '#bc0032' : '#004c97'}; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">${collection === 'training_requests' ? 'Training Scheduled' : 'Analysis Scheduled'}</h1>
            </div>
            
            <div style="padding: 20px;">
                <p>Dear ${fullName}${trainee2Name ? ` & ${trainee2Name}` : ''},</p>
                <p>Your <strong>${typeLabel}</strong> has been scheduled.</p>

                <div style="background-color: #f8f9fa; border-left: 5px solid ${collection === 'training_requests' ? '#bc0032' : '#004c97'}; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Session Credentials</h3>
                    <p style="margin-bottom: 5px;">Use these to unlock the PC:</p>
                    <table style="width: 100%;">
                        <tr><td style="color: #666;">Username:</td><td><strong>${apiUsername}</strong></td></tr>
                        <tr><td style="color: #666;">Password:</td><td><strong>${apiPassword}</strong></td></tr>
                    </table>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Date</td>
                        <td style="padding: 10px;">${scheduledTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Time</td>
                        <td style="padding: 10px;">${timeRange}</td>
                    </tr>
                    ${collection === 'training_requests' ? `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Dept / Cost Center</td>
                        <td style="padding: 10px;">${department}</td>
                    </tr>` : `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Analysis Type</td>
                        <td style="padding: 10px;">${analysisType}</td>
                    </tr>`}
                    <tr>
                        <td style="padding: 10px; font-weight: bold;">Admin Notes</td>
                        <td style="padding: 10px;">${notes || 'None'}</td>
                    </tr>
                </table>

                <p>A calendar invitation is attached.</p>
            </div>
            <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd;">
                <p style="margin: 0 0 5px;"><strong>PICSSL Lab</strong> | <a href="https://picssl-equipment.ca/" style="color: ${collection === 'training_requests' ? '#bc0032' : '#004c97'}; text-decoration: none;">https://picssl-equipment.ca/</a></p>
                <p style="margin: 0;">4700 Keele St, Petrie Science and Engineering Building, Room 020, Toronto, ON M3J 1P3</p>
            </div>
        </div>`;

        // Generate ICS
        const year = scheduledTime.getFullYear();
        const month = scheduledTime.getMonth() + 1;
        const day = scheduledTime.getDate();
        const hour = scheduledTime.getHours();
        const minute = scheduledTime.getMinutes();

        const event = {
            start: [year, month, day, hour, minute],
            duration: { hours: durationHours, minutes: durationMinutes },
            title: `OPTIR ${typeLabel}: ${fullName}${trainee2Name ? ` & ${trainee2Name}` : ''}`,
            description: `Scheduled ${typeLabel}\n\nTime: ${timeRange}\nNotes: ${notes || ''}\n\nCredentials:\nUser: ${apiUsername}\nPass: ${apiPassword}${trainee2Name ? `\n\nTrainee 2: ${trainee2Name}` : ''}`,
            location: '4700 Keele St, Petrie Science and Engineering Building, Room 020, Toronto, ON M3J 1P3',
            url: 'https://picssl-equipment.ca/',
            status: 'CONFIRMED',
            method: 'REQUEST',
            organizer: { name: 'OPTIR System', email: 'reservations@picssl.yorku.ca' },
            attendees: [
                { name: fullName, email: email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
            ]
        };

        if (supervisorEmail) {
            event.attendees.push({ name: 'Supervisor', email: supervisorEmail, role: 'OPT-PARTICIPANT' });
        }

        if (trainee2Name && trainee2Email) {
            event.attendees.push({ name: trainee2Name, email: trainee2Email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' });
        }

        if (transporter) {
            const { error, value } = ics.createEvent(event);
            const mailOptions = {
                from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>',
                to: [email, trainee2Email, supervisorEmail, "Arabha@yorku.ca", "rrizvi@yorku.ca"].filter(Boolean),
                subject: subject,
                html: html,
            };

            if (!error && value) {
                const finalIcs = value.replace('BEGIN:VCALENDAR', 'BEGIN:VCALENDAR\nX-WR-CALNAME:OPTIR Schedule');
                mailOptions.icalEvent = {
                    filename: 'invite.ics',
                    method: 'request',
                    content: finalIcs
                };
            }

            await transporter.sendMail(mailOptions);
            return NextResponse.json({ message: 'Scheduled and emailed successfully' });
        } else {
            console.log("MOCK SCHEDULE EMAIL", subject, html);
            return NextResponse.json({ message: 'Scheduled (Mock Email)', mock: true });
        }

    } catch (error) {
        console.error('Schedule API Error:', error);
        return NextResponse.json({ message: 'Failed to schedule', error: error.message }, { status: 500 });
    }
}
