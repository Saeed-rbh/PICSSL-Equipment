import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import * as ics from 'ics';
import { db } from '@/lib/firebaseAdmin';
import { toZonedTime, format, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Toronto';

export async function POST(req) {
    try {
        const body = await req.json();
        const { type } = body;
        const timestamp = new Date();

        if (!type || (type !== 'training' && type !== 'analysis')) {
            return NextResponse.json({ message: 'Invalid request type' }, { status: 400 });
        }

        // Common Fields
        const {
            fullName,
            email,
            supervisorEmail,
            scheduleDate, // "YYYY-MM-DD"
            startTime,    // "HH:MM"
            endTime,      // "HH:MM"
            notes
        } = body;

        console.log("DEBUG: Received request:", { scheduleDate, startTime, endTime });
        console.log("DEBUG: Timezone:", TIMEZONE);
        try {
            console.log("DEBUG: date-fns-tz exports:", Object.keys(require('date-fns-tz')));
        } catch (e) {
            console.log("DEBUG: Could not log exports:", e.message);
        }

        // Construct Date Objects in Toronto Time
        // Ensure startTime/endTime don't have seconds or handle them
        const cleanStart = startTime.split(':').slice(0, 2).join(':'); // Force HH:MM
        const cleanEnd = endTime.split(':').slice(0, 2).join(':');

        const startIso = `${scheduleDate}T${cleanStart}:00`;
        const endIso = `${scheduleDate}T${cleanEnd}:00`;

        console.log("DEBUG: Constructed ISO strings:", { startIso, endIso });

        // Create Date objects representing that time in that zone
        const scheduleStart = fromZonedTime(startIso, TIMEZONE);
        const scheduleEnd = fromZonedTime(endIso, TIMEZONE);

        console.log("DEBUG: Converted Dates (UTC):", {
            start: scheduleStart.toISOString(),
            end: scheduleEnd.toISOString()
        });

        if (scheduleEnd <= scheduleStart) {
            return NextResponse.json({ message: 'End time must be after start time' }, { status: 400 });
        }

        // Calculate Duration
        const durationMs = scheduleEnd - scheduleStart;
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        // Generate Credentials
        const apiUsername = `optir-${Math.floor(1000 + Math.random() * 9000)}`;
        const apiPassword = Math.random().toString(36).slice(-8);

        // Prepare Firestore Data
        let collectionName = '';
        let docData = {
            fullName,
            email,
            supervisorEmail,
            status: 'scheduled',
            createdAt: timestamp,
            scheduledDate: scheduleStart.toISOString(), // Store as absolute UTC
            scheduledEndDate: scheduleEnd.toISOString(),
            adminNotes: notes || '',
            generatedUsername: apiUsername,
            generatedPassword: apiPassword
        };

        let typeLabel = '';
        let trainee2Text = '';
        let recipients = ["Arabha@yorku.ca", "rrizvi@yorku.ca", email, supervisorEmail];

        if (type === 'training') {
            collectionName = 'training_requests';
            typeLabel = 'Training Session';
            const { trainee2Name, trainee2Email, department, costCenter } = body;

            docData = {
                ...docData,
                department,
                costCenter,
                trainee2Name,
                trainee2Email,
                supervisor: body.supervisor // supervisor name
            };

            if (trainee2Name) {
                trainee2Text = `\nTrainee 2: ${trainee2Name} (${trainee2Email || 'No email'})`;
                if (trainee2Email) recipients.push(trainee2Email);
            }

        } else if (type === 'analysis') {
            collectionName = 'analysis_requests';
            typeLabel = 'Sample Analysis';
            const { institution, sampleCount, sampleDescription, analysisType, estimatedCost, deliveryMethod } = body;

            docData = {
                ...docData,
                institution,
                sampleCount: parseInt(sampleCount),
                sampleDescription,
                analysisType,
                estimatedCost,
                deliveryMethod,
                costCenter: body.costCenter
            };
        }

        // Save to Firestore
        try {
            await db.collection(collectionName).add(docData);
        } catch (dbError) {
            console.error("Firestore Error:", dbError);
            return NextResponse.json({ message: 'Database error' }, { status: 500 });
        }

        // Send Email
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

        // Formatting for Email Display (Convert back to Toronto Time for string)
        const displayDate = format(toZonedTime(scheduleStart, TIMEZONE), 'EEEE, MMMM d, yyyy', { timeZone: TIMEZONE });
        const displayStartTime = format(toZonedTime(scheduleStart, TIMEZONE), 'hh:mm a', { timeZone: TIMEZONE });
        const displayEndTime = format(toZonedTime(scheduleEnd, TIMEZONE), 'hh:mm a', { timeZone: TIMEZONE });
        const timeRange = `${displayStartTime} - ${displayEndTime} (EST)`;

        const subject = `Confirmed: OPTIR ${typeLabel} - ${displayDate}`;

        const html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 0;">
            <div style="background-color: ${type === 'training' ? '#bc0032' : '#004c97'}; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">${type === 'training' ? 'Training Scheduled' : 'Analysis Scheduled'}</h1>
            </div>
            
            <div style="padding: 20px;">
                <p>Dear ${fullName}${docData.trainee2Name ? ` & ${docData.trainee2Name}` : ''},</p>
                <p>Your <strong>${typeLabel}</strong> has been scheduled.</p>

                <div style="background-color: #f8f9fa; border-left: 5px solid ${type === 'training' ? '#bc0032' : '#004c97'}; padding: 15px; margin: 20px 0;">
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
                        <td style="padding: 10px;">${displayDate}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Time</td>
                        <td style="padding: 10px;">${timeRange}</td>
                    </tr>
                    ${type === 'training' ? `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Dept / Cost Center</td>
                        <td style="padding: 10px;">${docData.department} / ${docData.costCenter || 'N/A'}</td>
                    </tr>` : `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Analysis Type</td>
                        <td style="padding: 10px;">${docData.analysisType}</td>
                    </tr>`}
                    <tr>
                        <td style="padding: 10px; font-weight: bold;">Admin Notes</td>
                        <td style="padding: 10px;">${notes || 'None'}</td>
                    </tr>
                </table>

                <p>A calendar invitation is attached.</p>
            </div>
            <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd;">
                <p style="margin: 0 0 5px;"><strong>PICSSL Lab</strong> | <a href="https://picssl-equipment.ca/" style="color: ${type === 'training' ? '#bc0032' : '#004c97'}; text-decoration: none;">https://picssl-equipment.ca/</a></p>
                <p style="margin: 0;">4700 Keele St, Petrie Science and Engineering Building, Room 020, Toronto, ON M3J 1P3</p>
            </div>
        </div>`;

        // Generate ICS within Toronto Time
        const zonedStart = toZonedTime(scheduleStart, TIMEZONE);
        const year = zonedStart.getFullYear();
        const month = zonedStart.getMonth() + 1;
        const day = zonedStart.getDate();
        const hour = zonedStart.getHours();
        const minute = zonedStart.getMinutes();

        const event = {
            start: [year, month, day, hour, minute],
            duration: { hours: durationHours, minutes: durationMinutes },
            title: `OPTIR ${typeLabel}: ${fullName}${docData.trainee2Name ? ` & ${docData.trainee2Name}` : ''}`,
            description: `Scheduled ${typeLabel}\n\nTime: ${timeRange}\nNotes: ${notes || ''}\n\nCredentials:\nUser: ${apiUsername}\nPass: ${apiPassword}${docData.trainee2Name ? `\n\nTrainee 2: ${docData.trainee2Name}` : ''}`,
            location: '4700 Keele St, Petrie Science and Engineering Building, Room 020, Toronto, ON M3J 1P3',
            url: 'https://picssl-equipment.ca/',
            status: 'CONFIRMED',
            method: 'REQUEST',
            organizer: { name: 'OPTIR System', email: 'picssl.equipment@gmail.com' },
            attendees: [
                { name: fullName, email: email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
            ]
        };

        if (supervisorEmail) {
            event.attendees.push({ name: 'Supervisor', email: supervisorEmail, role: 'OPT-PARTICIPANT' });
        }

        if (docData.trainee2Name && docData.trainee2Email) {
            event.attendees.push({ name: docData.trainee2Name, email: docData.trainee2Email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' });
        }

        if (transporter) {
            const { error, value } = ics.createEvent(event);
            const mailOptions = {
                from: '"OPTIR Reservation System" <picssl.equipment@gmail.com>',
                to: recipients.filter(Boolean),
                subject: subject,
                html: html,
            };

            if (!error && value) {
                const finalIcs = value.replace('BEGIN:VCALENDAR', 'BEGIN:VCALENDAR\nX-WR-CALNAME:OPTIR Schedule\nX-WR-TIMEZONE:America/Toronto');
                mailOptions.icalEvent = {
                    filename: 'invite.ics',
                    method: 'request',
                    content: finalIcs
                };
            }

            await transporter.sendMail(mailOptions);
            return NextResponse.json({ message: 'Request created and scheduled successfully' });
        } else {
            console.log("MOCK CREATE EMAIL", subject, html);
            return NextResponse.json({ message: 'Created (Mock Email)', mock: true });
        }

    } catch (error) {
        console.error('Create Request API Error:', error);
        return NextResponse.json({ message: 'Failed to create request', error: error.message }, { status: 500 });
    }
}
