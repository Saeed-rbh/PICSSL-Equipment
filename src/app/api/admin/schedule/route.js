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
        const { fullName, email, supervisorEmail, analysisType, department } = data;

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

        const emailText = `
Dear ${fullName},

Good news! Your ${typeLabel.toLowerCase()} has been scheduled.

Schedule Details:
-----------------
Date: ${scheduledTime.toLocaleDateString()}
Time: ${timeRange}
Location: 4700 Keele St, Petrie Building Room 020 - Science Store

${collection === 'analysis_requests' ? `Analysis Type: ${analysisType}` : `Department: ${department}`}

System Access Credentials (if needed during session):
Username: ${apiUsername}
Password: ${apiPassword}

Notes from Admin:
${notes || 'None'}

A calendar invitation is attached.

Best regards,
OPTIR Reservation System
        `;

        // Generate ICS
        const year = scheduledTime.getFullYear();
        const month = scheduledTime.getMonth() + 1;
        const day = scheduledTime.getDate();
        const hour = scheduledTime.getHours();
        const minute = scheduledTime.getMinutes();

        const event = {
            start: [year, month, day, hour, minute],
            duration: { hours: durationHours, minutes: durationMinutes },
            title: `OPTIR ${typeLabel}: ${fullName}`,
            description: `Scheduled ${typeLabel}\n\nTime: ${timeRange}\nNotes: ${notes || ''}\n\nCredentials:\nUser: ${apiUsername}\nPass: ${apiPassword}`,
            location: '4700 Keele St, Petrie Building Room 020 - Science Store, Toronto, Ontario M3J 1P3, Canada',
            url: 'http://picssl.yorku.ca',
            status: 'CONFIRMED',
            organizer: { name: 'OPTIR System', email: 'reservations@picssl.yorku.ca' },
            attendees: [
                { name: fullName, email: email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
            ]
        };

        if (supervisorEmail) {
            event.attendees.push({ name: 'Supervisor', email: supervisorEmail, role: 'OPT-PARTICIPANT' });
        }

        if (transporter) {
            const { error, value } = ics.createEvent(event);
            const mailOptions = {
                from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>',
                to: [email, supervisorEmail, "Arabha@yorku.ca"].filter(Boolean),
                subject: subject,
                text: emailText,
            };

            if (!error && value) {
                const finalIcs = value.replace('BEGIN:VCALENDAR', 'BEGIN:VCALENDAR\nX-WR-CALNAME:OPTIR Schedule');
                mailOptions.attachments = [{
                    filename: 'invite.ics',
                    content: finalIcs,
                    contentType: 'text/calendar; method=REQUEST; charset=UTF-8'
                }];
            }

            await transporter.sendMail(mailOptions);
            return NextResponse.json({ message: 'Scheduled and emailed successfully' });
        } else {
            console.log("MOCK SCHEDULE EMAIL", subject, emailText);
            return NextResponse.json({ message: 'Scheduled (Mock Email)', mock: true });
        }

    } catch (error) {
        console.error('Schedule API Error:', error);
        return NextResponse.json({ message: 'Failed to schedule', error: error.message }, { status: 500 });
    }
}
