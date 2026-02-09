import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import * as ics from 'ics';
import { db } from '@/lib/firebaseAdmin';

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

        // Construct Date Objects
        const startDateTime = new Date(`${scheduleDate}T${startTime}`);
        const endDateTime = new Date(`${scheduleDate}T${endTime}`);

        if (endDateTime <= startDateTime) {
            return NextResponse.json({ message: 'End time must be after start time' }, { status: 400 });
        }

        // Calculate Duration
        const durationMs = endDateTime - startDateTime;
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
            scheduledDate: startDateTime.toISOString(),
            scheduledEndDate: endDateTime.toISOString(),
            adminNotes: notes || '',
            generatedUsername: apiUsername,
            generatedPassword: apiPassword
        };

        let typeLabel = '';
        let trainee2Text = '';
        let recipients = [email, supervisorEmail, "Arabha@yorku.ca", "rrizvi@yorku.ca"];

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

        const subject = `Confirmed: OPTIR ${typeLabel} - ${startDateTime.toLocaleDateString()}`;
        const timeRange = `${startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

        const emailText = `
Dear ${fullName}${docData.trainee2Name ? ` & ${docData.trainee2Name}` : ''},

Good news! Your ${typeLabel.toLowerCase()} has been scheduled.

Schedule Details:
-----------------
Date: ${startDateTime.toLocaleDateString()}
Time: ${timeRange}
Location: 4700 Keele St, Petrie Building Room 020 - Science Store

${type === 'analysis' ? `Analysis Type: ${docData.analysisType}` : `Department: ${docData.department}`}
${trainee2Text}

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
        const year = startDateTime.getFullYear();
        const month = startDateTime.getMonth() + 1;
        const day = startDateTime.getDate();
        const hour = startDateTime.getHours();
        const minute = startDateTime.getMinutes();

        const event = {
            start: [year, month, day, hour, minute],
            duration: { hours: durationHours, minutes: durationMinutes },
            title: `OPTIR ${typeLabel}: ${fullName}${docData.trainee2Name ? ` & ${docData.trainee2Name}` : ''}`,
            description: `Scheduled ${typeLabel}\n\nTime: ${timeRange}\nNotes: ${notes || ''}\n\nCredentials:\nUser: ${apiUsername}\nPass: ${apiPassword}${docData.trainee2Name ? `\n\nTrainee 2: ${docData.trainee2Name}` : ''}`,
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

        if (docData.trainee2Name && docData.trainee2Email) {
            event.attendees.push({ name: docData.trainee2Name, email: docData.trainee2Email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' });
        }

        if (transporter) {
            const { error, value } = ics.createEvent(event);
            const mailOptions = {
                from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>',
                to: recipients.filter(Boolean),
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
            return NextResponse.json({ message: 'Request created and scheduled successfully' });
        } else {
            console.log("MOCK CREATE EMAIL", subject, emailText);
            return NextResponse.json({ message: 'Created (Mock Email)', mock: true });
        }

    } catch (error) {
        console.error('Create Request API Error:', error);
        return NextResponse.json({ message: 'Failed to create request', error: error.message }, { status: 500 });
    }
}
