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
