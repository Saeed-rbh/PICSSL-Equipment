import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import * as ics from 'ics';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req) {
    try {
        const body = await req.json();
        const timestamp = new Date(); // Common timestamp

        // Support both Uppercase (Local) and Lowercase (Firebase App Hosting) env vars
        const SMTP_HOST = process.env.SMTP_HOST || process.env.smtp_host;
        const SMTP_PORT = process.env.SMTP_PORT || process.env.smtp_port;
        const SMTP_USER = process.env.SMTP_USER || process.env.smtp_user;
        const SMTP_PASS = process.env.SMTP_PASS || process.env.smtp_pass;

        // Configure Transporter (Common for both types)
        let transporter;
        if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
            transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: parseInt(SMTP_PORT || '587'),
                secure: false, // true for 465, false for other ports
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
            });
        }

        // HANDLE TRAINING REQUEST
        if (body.type === 'training') {
            const { fullName, email, trainee2Name, trainee2Email, department, supervisor, supervisorEmail, costCenter, availability } = body;

            // Save to Firestore
            try {
                await db.collection('training_requests').add({
                    ...body,
                    createdAt: timestamp,
                    status: 'pending'
                });
            } catch (dbError) {
                console.error("Firestore Error (Training):", dbError);
            }

            // Email Content
            const subject = `New Training Request: ${fullName}`;
            const html = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #bc0032; border-bottom: 2px solid #bc0032; padding-bottom: 10px;">New Training Request</h2>
                <p><strong>Applicant:</strong> ${fullName} (${email})</p>
                ${trainee2Name ? `<p><strong>Trainee 2:</strong> ${trainee2Name} (${trainee2Email || 'No email provided'})</p>` : ''}
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr style="background: #f9f9f9;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Department</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${department}</td></tr>
                    <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Supervisor</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${supervisor} (${supervisorEmail})</td></tr>
                    <tr style="background: #f9f9f9;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Cost Center</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${costCenter || 'N/A'}</td></tr>
                    <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Fee</strong></td><td style="padding: 10px; border: 1px solid #ddd;">$250 CAD</td></tr>
                    <tr style="background: #f9f9f9;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Proponent Notes</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${availability}</td></tr>
                </table>
                <p style="margin-top: 20px;">We will contact you shortly to schedule your session.</p>
                <hr>
                <p style="font-size: 12px; color: #777;">OPTIR Reservation System | PICSSL Lab</p>
            </div>`;

            if (transporter) {
                await transporter.sendMail({
                    from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>',
                    to: ["Arabha@yorku.ca", "rrizvi@yorku.ca", email, supervisorEmail],
                    subject: subject,
                    html: html, // HTML Body
                });
                console.log(`Training Request Email sent`);
            } else {
                // Mock Log
                console.log("---------------------------------------------------");
                console.log("MOCK TRAINING EMAIL (HTML)");
                console.log("---------------------------------------------------");
            }

            return NextResponse.json({ message: 'Training request sent successfully' });
        }

        // HANDLE ANALYSIS REQUEST
        if (body.type === 'analysis') {
            const { fullName, email, institution, supervisorEmail, sampleCount, sampleDescription, analysisType, estimatedCost, deliveryMethod, costCenter } = body;

            // Save to Firestore
            try {
                await db.collection('analysis_requests').add({
                    ...body,
                    createdAt: timestamp,
                    status: 'pending'
                });
            } catch (dbError) {
                console.error("Firestore Error (Analysis):", dbError);
            }

            const subject = `New Sample Analysis Request: ${fullName}`;
            const html = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #004c97; border-bottom: 2px solid #004c97; padding-bottom: 10px;">Sample Analysis Request</h2>
                <p>Thank you for your submission. Please prepare your samples for delivery.</p>
                
                <h3 style="background:#eee; padding:5px;">Project Details</h3>
                <p><strong>Applicant:</strong> ${fullName} (${email})<br>
                <strong>Supervisor:</strong> ${supervisorEmail}<br>
                <strong>Institution:</strong> ${institution}</p>

                <h3 style="background:#eee; padding:5px;">Sample Info</h3>
                <p><strong>Count:</strong> ${sampleCount}<br>
                <strong>Type:</strong> ${analysisType}<br>
                <strong>Description:</strong> ${sampleDescription}</p>

                <h3 style="background:#eee; padding:5px;">Logistics</h3>
                <p><strong>Method:</strong> ${deliveryMethod}<br>
                <strong>Est. Cost:</strong> $${estimatedCost} CAD<br>
                <strong>Cost Center:</strong> ${costCenter || 'N/A'}</p>

                <div style="background: #f9f9d4; padding: 15px; border: 1px solid #e6db55; margin-top: 20px;">
                    <strong>Shipping Address:</strong><br>
                    Reza Rizvi<br>
                    4700 Keele St<br>
                    Petrie Building Room 002, Science Store<br>
                    Toronto, Ontario M3J 1P3, Canada
                </div>
                <hr>
                <p style="font-size: 12px; color: #777;">OPTIR Reservation System | PICSSL Lab</p>
            </div>`;

            if (transporter) {
                await transporter.sendMail({
                    from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>',
                    to: ["Arabha@yorku.ca", "rrizvi@yorku.ca", email, supervisorEmail],
                    subject: subject,
                    html: html,
                });
                console.log(`Analysis Request Email sent`);
            } else {
                console.log("---------------------------------------------------");
                console.log("MOCK ANALYSIS EMAIL (HTML)");
                console.log("---------------------------------------------------");
            }
            return NextResponse.json({ message: 'Analysis request sent successfully' });
        }

        // HANDLE RESERVATION (Standard Flow)
        // Default or explicit 'reservation' type
        const { fullName, email, supervisor, supervisorEmail, sampleName, selectedDate, selectedSlots, totalCost } = body;

        // Generate User Credentials
        const apiUsername = `optir-${Math.floor(1000 + Math.random() * 9000)}`;
        const apiPassword = Math.random().toString(36).slice(-8);

        // Save to Firestore
        try {
            await db.collection('reservations').add({
                ...body,
                generatedUsername: apiUsername,
                generatedPassword: apiPassword,
                createdAt: timestamp,
                status: 'confirmed'
            });
        } catch (dbError) {
            console.error("Firestore Error (Reservation):", dbError);
        }

        // 1. Create ICS Event
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
            location: '4700 Keele St, Petrie Building Room 020 - Science Store, Toronto, Ontario M3J 1P3, Canada',
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
            // We continue without attachment if error, or fail? specific fail is better.
            // For now, let's log and proceed or throw. Proceeding without ICS might be safer to at least notify.
        }

        const reservationSubject = `Confirmation: OPTIR Reservation - ${selectedDate.split('T')[0]}`;
        const html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 0;">
            <div style="background-color: #e31837; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Reservation Confirmed</h1>
            </div>
            
            <div style="padding: 20px;">
                <p>Dear ${fullName},</p>
                <p>Your session on the <strong>Optical Photothermal IR Spectroscopy</strong> system has been booked.</p>

                <div style="background-color: #f8f9fa; border-left: 5px solid #e31837; padding: 15px; margin: 20px 0;">
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
                        <td style="padding: 10px;">${dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Time</td>
                        <td style="padding: 10px;">${selectedSlots[0]} - ${selectedSlots.length} Hrs</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Sample</td>
                        <td style="padding: 10px;">${sampleName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold;">Est. Cost</td>
                        <td style="padding: 10px;">$${totalCost} CAD</td>
                    </tr>
                </table>

                <p style="font-size: 14px;"><strong>Supervisor:</strong> ${supervisor}</p>
                <p>A calendar invitation is attached.</p>
            </div>
            <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
                OPTIR Reservation System | PICSSL Lab<br>
                York University
            </div>
        </div>`;

        if (transporter) {
            const mailOptions = {
                from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>',
                to: [email, supervisorEmail, "Arabha@yorku.ca", "rrizvi@yorku.ca"],
                subject: reservationSubject,
                html: html, // HTML
            };

            if (!error && value) {
                // Determine Calendar Name
                const calName = 'OPTIR Reservation';
                // Inject X-WR-CALNAME if not present (simple hack)
                const finalIcs = value.replace('BEGIN:VCALENDAR', `BEGIN:VCALENDAR\nX-WR-CALNAME:${calName}`);

                mailOptions.attachments = [
                    {
                        filename: 'invite.ics',
                        content: finalIcs,
                        contentType: 'text/calendar; method=REQUEST; charset=UTF-8'
                    }
                ];
            }

            const info = await transporter.sendMail(mailOptions);
            console.log("Reservation Message sent: %s", info.messageId);
            return NextResponse.json({ message: 'Email sent successfully', messageId: info.messageId });
        } else {
            console.log("---------------------------------------------------");
            console.log("MOCK RESERVATION EMAIL (HTML)");
            console.log("---------------------------------------------------");
            return NextResponse.json({ message: 'Mock email logged to console', success: true });
        }

    } catch (error) {
        console.error('Email API Error:', error);
        return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
    }
}
