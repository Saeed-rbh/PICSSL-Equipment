import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import * as ics from 'ics';

export async function POST(req) {
    try {
        const body = await req.json();

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
            const { fullName, email, department, supervisor, supervisorEmail, costCenter, availability } = body;

            // Email Content
            const subject = `New Training Request: ${fullName}`;
            const text = `
Dear ${fullName},

Thank you for requesting training on the OPTIR system. We have received your request and will contact you shortly to schedule your session.

Here are the details we received:

Applicant: ${fullName}
Email: ${email}
Department/Lab: ${department}
Supervisor: ${supervisor}
Supervisor Email: ${supervisorEmail}

Payment Information:
Training Fee: $250 CAD
Cost Center: ${costCenter || 'N/A'}

Availability/Notes:
${availability}

Best regards,
OPTIR Reservation System
PICSSL Lab
            `;

            if (transporter) {
                await transporter.sendMail({
                    from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>',
                    to: ["Arabha@yorku.ca", email, supervisorEmail],
                    subject: subject,
                    text: text,
                });
                console.log(`Training Request Email sent`);
            } else {
                // Mock Log
                console.log("---------------------------------------------------");
                console.log("MOCK TRAINING EMAIL (No SMTP Credentials)");
                console.log(`To: Arabha@yorku.ca, ${email}, ${supervisorEmail}`);
                console.log(`Subject: ${subject}`);
                console.log("Body:", text);
                console.log("---------------------------------------------------");
            }

            return NextResponse.json({ message: 'Training request sent successfully' });
        }

        // HANDLE ANALYSIS REQUEST
        if (body.type === 'analysis') {
            const { fullName, email, institution, supervisorEmail, sampleCount, sampleDescription, analysisType, estimatedCost, deliveryMethod, costCenter } = body;

            const subject = `New Sample Analysis Request: ${fullName}`;
            const text = `
Dear ${fullName},

Thank you for your sample analysis request. We have received your submission and will be expecting your samples.

Request Details:
----------------
Applicant: ${fullName}
Email: ${email}
Institution: ${institution}
Supervisor Email: ${supervisorEmail}

Sample Information:
Count: ${sampleCount}
Description: ${sampleDescription}
Desired Analysis: ${analysisType}

Logistics:
Delivery Method: ${deliveryMethod}

Cost Estimate:
Estimated Fee: $${estimatedCost} CAD
Cost Center: ${costCenter || 'N/A'}

Shipping Address (if applicable):
Reza Rizvi
4700 Keele St
Petrie Building Room 002, science store
Toronto, Ontario M3J 1P3
Canada

Next Steps:
Please ensure your samples are labeled clearly. If shipping, include a copy of this email in the package.

Best regards,
OPTIR Reservation System
PICSSL Lab
            `;

            if (transporter) {
                await transporter.sendMail({
                    from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>',
                    to: ["Arabha@yorku.ca", email, supervisorEmail],
                    subject: subject,
                    text: text,
                });
                console.log(`Analysis Request Email sent`);
            } else {
                console.log("---------------------------------------------------");
                console.log("MOCK ANALYSIS EMAIL (No SMTP Credentials)");
                console.log(`To: Arabha@yorku.ca, ${email}, ${supervisorEmail}`);
                console.log(`Subject: ${subject}`);
                console.log("Body:", text);
                console.log("---------------------------------------------------");
            }
            return NextResponse.json({ message: 'Analysis request sent successfully' });
        }

        // HANDLE RESERVATION (Standard Flow)
        // Default or explicit 'reservation' type
        const { fullName, email, supervisor, supervisorEmail, sampleName, selectedDate, selectedSlots, totalCost } = body;

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
            // We continue without attachment if error, or fail? specific fail is better.
            // For now, let's log and proceed or throw. Proceeding without ICS might be safer to at least notify.
        }

        const reservationSubject = `Confirmation: OPTIR Reservation - ${selectedDate.split('T')[0]}`;
        const reservationText = `
Dear ${fullName},

Your reservation on the OPTIR system has been confirmed.

Details:
--------
Date: ${dateObj.toLocaleDateString()}
Time: ${selectedSlots.join(', ')} (${durationHours} hours)
Sample: ${sampleName}
Estimated Cost: $${totalCost} CAD

Supervisor: ${supervisor}

A calendar invitation is attached to this email.

Best regards,
OPTIR Reservation System
PICSSL Lab
        `;

        if (transporter) {
            const mailOptions = {
                from: '"OPTIR Reservation System" <reservations@picssl.yorku.ca>',
                to: [email, supervisorEmail, "Arabha@yorku.ca"],
                subject: reservationSubject,
                text: reservationText,
            };

            if (!error && value) {
                mailOptions.icalEvent = {
                    filename: 'reservation.ics',
                    method: 'request',
                    content: value
                };
            }

            const info = await transporter.sendMail(mailOptions);
            console.log("Reservation Message sent: %s", info.messageId);
            return NextResponse.json({ message: 'Email sent successfully', messageId: info.messageId });
        } else {
            console.log("---------------------------------------------------");
            console.log("MOCK RESERVATION EMAIL (No SMTP Credentials)");
            console.log(`To: ${email}, ${supervisorEmail}, Arabha@yorku.ca`);
            console.log(`Subject: ${reservationSubject}`);
            console.log("Body:", reservationText);
            console.log("---------------------------------------------------");
            return NextResponse.json({ message: 'Mock email logged to console', success: true });
        }

    } catch (error) {
        console.error('Email API Error:', error);
        return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
    }
}
