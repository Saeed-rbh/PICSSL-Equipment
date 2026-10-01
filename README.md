# OPTIR Equipment Access & Reservation System

A complete solution for managing lab equipment access, tracking usage, and billing. This system consists of a **Web Portal** for bookings and an **Access Control Client** (Kiosk) running on local equipment PCs.

## 🚀 Features

### For Researchers (Users)
-   **Equipment Reservation**: Visual calendar to book time slots for instruments.
-   **Service Requests**: Direct forms to request **Training** or **Sample Analysis** from staff.
-   **Automated Credentials**: Receive a unique, generated Username & Password for every reservation.
-   **Usage Tracking**: Pay only for the time you actually use (tracked to the minute).

### For Administrators
-   **Admin Dashboard**: Central hub to view reservations and service requests.
-   **Access Logs**: Detailed history of every login/logout event, including offline usage.
-   **Cost Management**:
    -   Automatic cost calculation and cumulative session tracking.

### Kiosk Client (PC Lock Screen)
-   **Security**: Locks the equipment PC until valid reservation credentials are entered.
-   **Time Enforcement**:
    -   Prevents login before the booked start time.
    -   Rejects login after the session expiry.
-   **Dual Monitor**: Displays status on primary screen and instructions on secondary monitor.
-   **Network Resilience**:
    -   New sessions require an online reservation check.
    -   If connectivity fails during logout, the report is queued locally and retried when the kiosk client next starts online. Rejected reports are saved for staff review.
-   **Tamper Protection**: Hides console, blocks Alt+Tab, and prevents closing.

---

## 📖 User Guide

### 1. Booking Equipment
1.  Navigate to the **Reservations** page.
2.  Select the desired instrument and Date.
3.  Click available time slots and hit **"Submit Reservation"**.
4.  **Important**: Note down the **Generated Username & Password** shown in the confirmation popup.

### 2. Accessing Equipment
1.  Approach the locked Equipment PC.
2.  Enter the **Username** and **Password** from your reservation.
3.  Click **"Unlock & Start Session"**.
4.  Work on your experiment.
    *   *Note: If you are too early or your time has expired, access will be denied.*

### 3. Ending Session
1.  When finished, click the red **"LOG OUT & LOCK"** button on the timer window.
2.  Your duration will be recorded, and the total cost updated on the portal.

---

## 🛠️ Admin Guide

### Dashboard Access
- Log in to `/admin` using the deployment-configured administrator password.
- Set a new `ADMIN_PASSWORD` yourself as the Firebase App Hosting `admin-password` secret; it must be at least 16 characters. Revoke the previously exposed SMTP app password with its provider, then configure replacement account credentials as the `smtp-user` and `smtp-pass` secrets referenced in `apphosting.yaml`. Follow the [Firebase App Hosting secret configuration guide](https://firebase.google.com/docs/app-hosting/configure#store-and-access-secret-parameters). Secret values must stay out of source files and version control.
- Exports require an authenticated admin session; the old query-parameter credential is no longer accepted by the updated endpoint.
- Review the backend's console environment overrides before rollout and remove any stale credential values there. Confirm the backend's live branch and automatic rollout setting in Firebase Console; do not assume a source change has reached production.
- At a planned maintenance window, deploy the updated server and replace the kiosk client on each equipment PC. The server rollout invalidates the old export query credential; the client requires online reservation verification and retires legacy shared-administrator session records for staff review. Verify the old login and export paths are rejected, and keep the lab's equipment-access procedure available while clients and server are updated.

### Managing Logs
- **View History**: Click "View" on any reservation to see a specific breakdown of its session history.
- **Clear Logs**: In the "Access Logs" tab, use the "Clear All Logs" button to wipe the history.

### Network Outages
New kiosk sessions require successful server verification. There is no shared offline override. If connectivity fails, follow the lab's established equipment-access procedure and preserve the usage record.

---

## 💻 Installation Guide (Equipment PC)

### Prerequisites
-   Windows 10/11
-   Python 3.x installed

### Setup Kiosk Client
1.  Copy the `equipment_pc_client.pyw` file to the PC.
2.  **Run on Startup**:
    -   Press `Win + R`, type `shell:startup`, and press Enter.
    -   Create a **Shortcut** to `equipment_pc_client.pyw` in this folder.
3.  **Run**: Double-click the script to lock the screen.

### Troubleshooting
-   **"Network Failed"**: New sessions require server verification. Contact lab staff and follow the lab's established access procedure; the kiosk has no shared offline override.
-   **"Usage saved locally"**: Internet failed during logout. The report is retried at the next client startup with connectivity; check `offline_logs.txt` in the script directory. A rejected report is stored in `unverified_sessions.jsonl` for staff review.
-   **Closing the Kiosk**: The app is designed to be unclosable. To close it for maintenance, open Task Manager (`Ctrl+Shift+Esc`) and end the `Python` process.

---

## 💰 Pricing & Rates

| Service | Rate | Notes |
| :--- | :--- | :--- |
| **Instrument Access** | **$50 CAD / hour** | Standard academic rate. Charged based on actual usage duration. |
| **PICSSL Group** | **$0 CAD** | Internal usage. |
| **Training Session** | **$250 CAD** | Flat fee per trainee. |
| **Sample Analysis** | **Custom** | Estimated cost provided during request. |

---

## 📧 Email Notifications

### Recipients
All system emails are sent from `picssl.equipment@gmail.com`.
The following parties receive notifications for **Training**, **Analysis**, and **Reservation** actions:
1.  **Arabha@yorku.ca** (Admin)
2.  **rrizvi@yorku.ca** (Admin)
3.  **Applicant** (The user making the request)
4.  **Supervisor** (The supervisor email provided in the form)

### Email Templates

#### 1. Training Request
**Subject:** `New Training Request: [Applicant Name]`
**Body:**
> **New Training Request**
>
> **Applicant:** [Name] ([Email])
> **Trainee 2:** [Name] (if applicable)
>
> **Department:** [Dept]
> **Supervisor:** [Name] ([Email])
> **Cost Center:** [Code]
> **Fee:** $250 CAD
> **Proponent Notes:** [Availability]
>
> We will contact you shortly to schedule your session.
>
> **PICSSL Lab** | https://picssl-equipment.ca/
> 4700 Keele St, Petrie Science and Engineering Building, Room 020
> Toronto, ON M3J 1P3

#### 2. Sample Analysis Request
**Subject:** `New Sample Analysis Request: [Applicant Name]`
**Body:**
> **Sample Analysis Request**
>
> **Project Details**
> Applicant: [Name] ([Email])
> Supervisor: [Email]
> Institution: [Institution]
>
> **Sample Info**
> Count: [Number]
> Type: [Type]
> Description: [Description]
>
> **Logistics**
> Method: [Delivery Method]
> Est. Cost: $[Amount] CAD
> Cost Center: [Code]
>
> **Shipping Address:**
> Reza Rizvi
> 4700 Keele St
> Petrie Building Room 002, Science Store
> Toronto, Ontario M3J 1P3, Canada
>
> **PICSSL Lab** | https://picssl-equipment.ca/
> 4700 Keele St, Petrie Science and Engineering Building, Room 020
> Toronto, ON M3J 1P3

#### 3. Reservation Confirmation
**Subject:** `Confirmation: OPTIR Reservation - [Date]`
**Body:**
> **Reservation Confirmed**
>
> Dear [Name],
> Your session on the **Optical Photothermal IR Spectroscopy** system has been booked.
>
> **Session Credentials**
> Use these to unlock the PC:
> Username: **[Generated Username]**
> Password: **[Generated Password]**
>
> **Date:** [Date]
> **Time:** [Start Time] - [Duration] Hrs
> **Sample:** [Sample Name]
> **Est. Cost:** $[Amount] CAD
> **Supervisor:** [Name]
>
> *A calendar invitation (ICS) is attached.*
>
> **PICSSL Lab** | https://picssl-equipment.ca/
> 4700 Keele St, Petrie Science and Engineering Building, Room 020, Toronto, ON M3J 1P3

#### 4. Admin Scheduled Request (Training/Analysis)
**Subject:** `Confirmed: OPTIR [Type] - [Date]`
**Body:**
> **[Type] Scheduled**
>
> Dear [Name],
> Your **[Type]** has been scheduled.
>
> **Session Credentials**
> Use these to unlock the PC:
> Username: **[Generated Username]**
> Password: **[Generated Password]**
>
> **Date:** [Date]
> **Time:** [Start Time] - [End Time]
> **Dept/Type:** [Details]
> **Admin Notes:** [Notes]
>
> *A calendar invitation (ICS) is attached.*
>
> **PICSSL Lab** | https://picssl-equipment.ca/
> 4700 Keele St, Petrie Science and Engineering Building, Room 020, Toronto, ON M3J 1P3
