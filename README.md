# OPTIR Equipment Access & Reservation System

A complete solution for managing lab equipment access, tracking usage, and billing. This system consists of a **Web Portal** for bookings and an **Access Control Client** (Kiosk) running on local equipment PCs.

## 🚀 Features

### For Researchers (Users)
-   **Equipment Reservation**: Visual calendar to book time slots for instruments.
-   **Service Requests**: Direct forms to request **Training** or **Sample Analysis** from staff.
-   **Automated Credentials**: Receive a unique, generated Username & Password for every reservation.
-   **Usage Tracking**: Pay only for the time you actually use (tracked to the minute).

### For Administrators
-   **Admin Dashboard**: Central hub to view all Reservations, Training Requests, and Analysis Requests.
-   **Access Logs**: Detailed history of every login/logout event, including offline usage.
-   **Cost Management**:
    -   Automatic cost calculation ($50/hr standard, $0 for PICSSL/Admin).
    -   Cumulative tracking: Multiple sessions for one reservation are summed up.
-   **Emergency Control**:
    -   **Clear Logs**: Ability to flush old access logs.
    -   **Override**: Admin credentials (`admin`) bypass time checks and lock barriers.

### Kiosk Client (PC Lock Screen)
-   **Security**: Locks the equipment PC until valid credentials are entered.
-   **Time Enforcement**:
    -   Prevents login before the booked start time.
    -   Rejects login after the session expiry.
-   **Dual Monitor**: Displays status on primary screen and instructions on secondary monitor.
-   **Offline Mode**:
    -   **Emergency Entry**: Admin can unlock PC without internet.
    -   **Data Safety**: Saves usage logs locally if network fails during logout.
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
-   Log in to `/admin` to view the dashboard.
-   **Tabs**: Switch between Reservations, Training, Analysis, and Access Logs.

### Managing Logs
-   **View History**: Click "View" on any reservation to see a specific breakdown of its session history.
-   **Clear Logs**: In the "Access Logs" tab, use the "Clear All Logs" button to wipe the history.

### Emergency Override (Kiosk)
If the internet is down or a user is stuck:
-   **Username**: `admin`
-   **Password**: `picssl2026`
-   *This grants immediate access and bypasses reporting/billing, ensuring instruments are never held hostage by network issues.*

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
-   **"Network Failed"**: The client has switched to Offline Mode. Use Admin credentials to unlock.
-   **"Usage saved locally"**: Internet failed during logout. Check `offline_logs.txt` in the script directory for the usage report.
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
All system emails are sent from `reservations@picssl.yorku.ca`.
The following parties receive notifications for **Training**, **Analysis**, and **Reservation** actions:
1.  **Arabha@yorku.ca** (Admin)
2.  **Applicant** (The user making the request)
3.  **Supervisor** (The supervisor email provided in the form)

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
