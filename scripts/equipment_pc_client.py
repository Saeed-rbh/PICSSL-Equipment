import tkinter as tk
from tkinter import messagebox
import requests
import time
import threading
import json
import os

import  ctypes

# CONFIGURATION
API_BASE_URL = "https://picssle-quipment--pic-equipment.us-east4.hosted.app/api/access"  # Update this to your deployed URL
STATE_FILE = "optir_session_state.json"


# SCREEN CONFIGURATION (Adjust for your specific monitors)
PRIMARY_W = 1920
SECONDARY_W = 1920
SECONDARY_H = 1080
WIN_W = 300
WIN_H = 120
WIN_W = 300
WIN_H = 150 # Increased height for larger button
PAD = 70 

# Position: Bottom-Right of 2nd Monitor (Assuming 2nd is right of Primary)
POS_X = PRIMARY_W + SECONDARY_W - WIN_W - PAD + 20
POS_Y = SECONDARY_H - WIN_H - PAD

POS_X = PRIMARY_W + SECONDARY_W - WIN_W - PAD + 20
POS_Y = SECONDARY_H - WIN_H - PAD

def hide_console():
    """Hides the parent console window"""
    try:
        kernel32 = ctypes.WinDLL('kernel32')
        user32 = ctypes.WinDLL('user32')
        hwnd = kernel32.GetConsoleWindow()
        if hwnd:
            user32.ShowWindow(hwnd, 0) # SW_HIDE = 0
    except Exception as e:
        print(f"Error hiding console: {e}")

# Call immediately
hide_console()

class OptirKioskApp:
    def __init__(self, root):
        self.root = root
        self.root.title("OPTIR Access Control")
        
        # State
        self.username = ""
        self.password = ""
        self.start_time = 0
        self.session_active = False
        self.fullname = ""

        # Saved sessions stay locked until the server verifies the reservation.
        self.pending_restore = self.load_state()
        self.setup_lock_screen()
        if self.pending_restore:
            self.root.after(500, self.restore_saved_session)

        # Start offline logs sync in the background
        threading.Thread(target=self.sync_offline_logs, daemon=True).start()

    def sync_offline_logs(self):
        """Retries queued reservation reports once when the client starts online."""
        offline_file = "offline_sessions.jsonl"
        if not os.path.exists(offline_file):
            return

        try:
            with open(offline_file, "r", encoding="utf-8") as f:
                lines = f.readlines()

            remaining_lines = []
            for line in lines:
                try:
                    data = json.loads(line)
                except (json.JSONDecodeError, TypeError):
                    remaining_lines.append(line)
                    continue

                if str(data.get("username", "")).lower() == "admin":
                    if not self.record_unverified_session(data, "Legacy administrator session requires staff review"):
                        remaining_lines.append(line)
                    continue

                try:
                    response = requests.post(f"{API_BASE_URL}/report", json={
                        "username": data.get("username"),
                        "password": data.get("password"),
                        "durationMinutes": data.get("durationMinutes")
                    }, timeout=10)
                except requests.RequestException:
                    remaining_lines.append(line)
                    continue

                try:
                    response_data = response.json()
                except (ValueError, AttributeError):
                    response_data = None

                if response.ok and isinstance(response_data, dict) and response_data.get("success"):
                    continue

                terminal_rejection = (
                    400 <= response.status_code < 500
                    or (response.ok and isinstance(response_data, dict) and response_data.get("success") is False)
                )
                if terminal_rejection and self.record_unverified_session(
                    data, "Queued report was rejected and needs staff review"
                ):
                    continue

                remaining_lines.append(line)

            if remaining_lines:
                with open(offline_file, "w", encoding="utf-8") as f:
                    f.writelines(remaining_lines)
            else:
                os.remove(offline_file)
        except Exception:
            # Keep the queue for a later launch if local or network I/O fails.
            return

    def save_state(self):
        """Persists the session to disk in case of reboot/crash"""
        try:
            with open(STATE_FILE, 'w') as f:
                json.dump({
                    "username": self.username,
                    "password": self.password,
                    "fullname": self.fullname,
                    "start_time": self.start_time,
                    "session_active": self.session_active
                }, f)
        except Exception as e:
            print(f"Error saving state: {e}")

    def load_state(self):
        """Reads a saved session without unlocking the kiosk."""
        if not os.path.exists(STATE_FILE):
            return None
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            self.clear_state()
            return None

        if not data.get("session_active"):
            self.clear_state()
            return None

        username = str(data.get("username") or "")
        if username.lower() == "admin":
            if self.record_unverified_session(data, "Legacy administrator session was retired"):
                self.clear_state()
            return None

        if not username or not data.get("password") or data.get("start_time") is None:
            if self.record_unverified_session(data, "Incomplete saved session requires staff review"):
                self.clear_state()
            return None

        return data

    def restore_saved_session(self):
        """Restores a reservation session only after the server verifies it."""
        saved = self.pending_restore
        if not saved or self.session_active:
            return

        try:
            response = requests.post(f"{API_BASE_URL}/verify", json={
                "username": saved.get("username"),
                "password": saved.get("password")
            }, timeout=10)
        except requests.RequestException:
            self.status_label.config(text="Previous session is locked until server verification is available.", fg="red")
            self.root.after(30000, self.restore_saved_session)
            return

        if response.status_code >= 500:
            self.status_label.config(text="Could not verify previous session. Retrying while the kiosk stays locked.", fg="red")
            self.root.after(30000, self.restore_saved_session)
            return

        try:
            result = response.json()
        except ValueError:
            result = {}

        session_data = result.get("data") if isinstance(result, dict) else None
        if response.ok and isinstance(result, dict) and result.get("success") and isinstance(session_data, dict):
            try:
                self.username = str(saved["username"])
                self.password = str(saved["password"])
                self.fullname = session_data.get("fullName") or saved.get("fullname") or "Restored Session"
                self.start_time = float(saved["start_time"])
            except (KeyError, TypeError, ValueError):
                session_data = None
            else:
                self.pending_restore = None
                self.session_active = True
                self.start_session(self.fullname, restoring=True)
                return

        if self.record_unverified_session(saved, "Saved session could not be verified and requires staff review"):
            self.clear_state()
            self.pending_restore = None
            self.status_label.config(text="Previous session needs staff review. Enter a current reservation to continue.", fg="red")
        else:
            self.status_label.config(text="Previous session needs staff review; local record could not be saved. Contact staff.", fg="red")
            self.root.after(30000, self.restore_saved_session)

    def record_unverified_session(self, data, reason):
        try:
            start_time = data.get("start_time")
            duration = data.get("durationMinutes")
            if duration is None and start_time is not None:
                duration = max(0, (time.time() - float(start_time)) / 60)
            record = {
                "username": str(data.get("username") or "unknown"),
                "fullName": str(data.get("fullname") or data.get("fullName") or ""),
                "startedAt": start_time,
                "reportedDurationMinutes": float(duration) if duration is not None else None,
                "recordedAt": time.time(),
                "requiresStaffReview": True,
                "reason": reason
            }
            with open("unverified_sessions.jsonl", "a", encoding="utf-8") as f:
                json.dump(record, f)
                f.write("\n")
            return True
        except Exception:
            return False

    def queue_offline_report(self, data):
        try:
            timestamp = data.get("timestamp") or time.strftime("%Y-%m-%d %H:%M:%S")
            queued = {
                "username": data.get("username"),
                "password": data.get("password"),
                "fullname": data.get("fullname", ""),
                "start_time": data.get("start_time"),
                "durationMinutes": float(data.get("durationMinutes", 0)),
                "timestamp": timestamp
            }
            with open("offline_sessions.jsonl", "a", encoding="utf-8") as f:
                json.dump(queued, f)
                f.write("\n")
            with open("offline_logs.txt", "a", encoding="utf-8") as f:
                f.write(f"[{timestamp}] User: {queued['username']} | Duration: {queued['durationMinutes']:.2f} mins | Pending server retry\n")
            return True
        except Exception:
            return False

    def clear_state(self):
        """Removes the persistent state file on legitimate logout"""
        try:
            if os.path.exists(STATE_FILE):
                os.remove(STATE_FILE)
        except Exception as e:
            print(f"Error clearing state: {e}")

    def enforce_kiosk_focus(self):
        """Aggressively keeps window on top when locked"""
        if not self.session_active:
            try:
                # Always keep topmost
                self.root.attributes("-topmost", True)
                self.root.lift()
                
                # Check if we have focus
                focused_widget = self.root.focus_get()
                
                # If no widget in our app has focus, reclaim it
                if focused_widget is None:
                    self.root.focus_force()
                    # Default to username entry if visible
                    if hasattr(self, 'entry_user'):
                        self.entry_user.focus_set()

                # Also handle secondary window
                if hasattr(self, 'win2') and self.win2 and self.win2.winfo_exists():
                     self.win2.attributes("-topmost", True)
                     self.win2.lift()

            except Exception:
                pass
            
            # Check every 100ms (50ms might be too interfering)
            self.root.after(100, self.enforce_kiosk_focus)

    def on_focus_out(self, event):
        """Trigger refocus immediately if we lose focus"""
        # Only act if the window itself lost focus, not just a widget inside it
        if not self.session_active:
             focused = self.root.focus_get()
             if focused is None:
                 self.enforce_kiosk_focus()

    def setup_lock_screen(self):
        # Clean up any existing widgets (previous session)
        for widget in self.root.winfo_children():
            widget.destroy()

        # Reset conflict flags ensuring clean state
        self.root.overrideredirect(False)
        self.root.geometry("") # Reset geometry to default

        # Configure full screen / locked mode
        self.root.attributes("-fullscreen", True)
        self.root.attributes("-topmost", True)
        self.root.overrideredirect(True) # Removes title bar
        self.root.configure(bg="#0d1117")

        # Disable Alt+F4 (Soft prevention)
        self.root.protocol("WM_DELETE_WINDOW", lambda: None)
        
        # Bind FocusOut to regain control instantly
        self.root.bind("<FocusOut>", self.on_focus_out)
        
        # Ensure the root window is updated so we get correct screen dimensions
        self.root.update_idletasks()
        
        # Start Security Loop
        self.enforce_kiosk_focus()

        
        # Auto-detect Primary Width for offset
        # Note: winfo_screenwidth() usually returns the width of the screen the window is on (Primary)
        current_primary_w = self.root.winfo_screenwidth()
        print(f"DEBUG: Detected Primary Width: {current_primary_w}")

        # UI Elements
        self.frame = tk.Frame(self.root, bg="#161b22", padx=40, pady=40)
        self.frame.place(relx=0.5, rely=0.5, anchor="center")

        tk.Label(self.frame, text="OPTIR Equipment Locked", font=("Arial", 24, "bold"), fg="#c9d1d9", bg="#161b22").pack(pady=(0, 20))
        
        tk.Label(self.frame, text="Username", font=("Arial", 12), fg="#8b949e", bg="#161b22").pack(anchor="w")
        self.entry_user = tk.Entry(self.frame, font=("Arial", 14), width=25)
        self.entry_user.pack(pady=(5, 15))

        tk.Label(self.frame, text="Password", font=("Arial", 12), fg="#8b949e", bg="#161b22").pack(anchor="w")
        self.entry_pass = tk.Entry(self.frame, show="*", font=("Arial", 14), width=25)
        self.entry_pass.pack(pady=(5, 20))

        btn = tk.Button(self.frame, text="Unlock & Start Session", command=self.verify_login, 
                        font=("Arial", 14, "bold"), bg="#2ea043", fg="white", 
                        activebackground="#2c974b", activeforeground="white",
                        bd=0, padx=20, pady=10, cursor="hand2")
        btn.pack(fill="x")

        # Status Label
        self.status_label = tk.Label(self.frame, text="", fg="red", bg="#161b22", font=("Arial", 10))
        self.status_label.pack(pady=(10, 0))

        # Reset fields
        self.entry_user.delete(0, tk.END)
        self.entry_pass.delete(0, tk.END)
        self.entry_user.focus()

        # --- SECONDARY MONITOR LOCK SCREEN ---
        # Create a top-level window for the second monitor
        self.win2 = tk.Toplevel(self.root)
        self.win2.title("OPTIR Lock Screen - Monitor 2")
        
        # Important: Set geometry BEFORE fullscreen to ensure it lands on the right screen
        # We use the detected 'current_primary_w' as the X offset
        geo_string = f"{SECONDARY_W}x{SECONDARY_H}+{current_primary_w}+0"
        print(f"DEBUG: Setting 2nd Window Geometry: {geo_string}")
        
        self.win2.geometry(geo_string)
        self.win2.overrideredirect(True) # Remove title bar
        self.win2.configure(bg="black")
        
        # Force update to ensure placement
        self.win2.update()
        
        # NOTE: We do NOT use attributes("-fullscreen", True) here because it often 
        # forces the window back to the primary screen on Windows.
        # Instead we rely on the geometry moving it to the second screen coordinates.

        
        # Instructions Frame
        frame2 = tk.Frame(self.win2, bg="black")
        frame2.place(relx=0.5, rely=0.5, anchor="center")

        tk.Label(frame2, text="INSTRUCTIONS", font=("Arial", 28, "bold"), fg="white", bg="black").pack(pady=(0, 30))

        instructions = [
            "ACCESS PROTOCOL",
            "--------------------------------------------------",
            "1. BOOKING: Ensure you have an active reservation via the Web Portal.",
            "2. LOGIN: Enter the credentials provided in your confirmation email.",
            "3. OPERATION: Your session duration is tracked automatically.",
            "4. LOGOUT: You MUST click 'Log Out & Lock' when finished.",
            "--------------------------------------------------",
            "Note: Unreported sessions may incur maximum daily charges."
        ]

        for line in instructions:
            tk.Label(frame2, text=line, font=("Arial", 16), fg="#c9d1d9", bg="black", wraplength=800, justify="left").pack(anchor="w", pady=5)



    def verify_login(self):
        user = self.entry_user.get()
        pwd = self.entry_pass.get()
        self.status_label.config(text="Verifying...", fg="#58a6ff")
        self.root.update()

        try:
            response = requests.post(f"{API_BASE_URL}/verify", json={"username": user, "password": pwd}, timeout=10)
            data = response.json()
            if response.ok and data.get("success") and isinstance(data.get("data"), dict):
                saved = self.pending_restore
                restoring = bool(saved and saved.get("username") == user and saved.get("password") == pwd)
                if saved and not restoring:
                    if not self.record_unverified_session(saved, "Prior saved session was replaced by a new verified login"):
                        self.status_label.config(text="Previous session needs staff review; contact staff before continuing.", fg="red")
                        return
                    self.clear_state()
                self.pending_restore = None
                self.username = user
                self.password = pwd
                self.fullname = data["data"]["fullName"]
                if restoring:
                    self.start_time = float(saved["start_time"])
                    self.session_active = True
                self.start_session(self.fullname, restoring=restoring)
            else:
                self.status_label.config(text=data.get("message", "Login Failed"), fg="red")
        except Exception:
            self.status_label.config(text="Network Error: server verification failed", fg="red")

    def start_session(self, fullname, restoring=False):
        self.fullname = fullname
        
        # "Unlock": Destroy lock screen elements and show session timer
        for widget in self.root.winfo_children():
            widget.destroy()

        # Destroy the secondary lock window if it exists
        if hasattr(self, 'win2') and self.win2:
            self.win2.destroy()


        self.root.attributes("-fullscreen", False)
        self.root.attributes("-topmost", False) # Allow other windows to cover it
        self.root.overrideredirect(True)
        # Position on 2nd monitor bottom-right
        self.root.geometry(f"{WIN_W}x{WIN_H}+{POS_X}+{POS_Y}") 
        self.root.configure(bg="#333")

        if not restoring:
            self.start_time = time.time()
            self.session_active = True
            
        self.save_state() # Persist the start_time to disk immediately

        # Session UI
        tk.Label(self.root, text=f"User: {fullname}", fg="white", bg="#333").pack(pady=(10, 5))
        
        self.timer_label = tk.Label(self.root, text="00:00", font=("Courier", 30, "bold"), fg="#58a6ff", bg="#333")
        self.timer_label.pack()

        btn_logout = tk.Button(self.root, text="LOG OUT & LOCK", command=self.logout, 
                               font=("Arial", 12, "bold"), bg="#da3633", fg="white", 
                               activebackground="#b62324", activeforeground="white",
                               bd=0, padx=20, pady=10, cursor="hand2")
        btn_logout.pack(pady=15, fill="x", padx=20)

        # Start Clock Loop
        self.update_clock()

    def update_clock(self):
        if self.session_active:
            elapsed = int(time.time() - self.start_time)
            mins, secs = divmod(elapsed, 60)
            hours, mins = divmod(mins, 60)
            # Format: HH:MM
            self.timer_label.config(text=f"{hours:02}:{mins:02}")
            self.root.after(1000, self.update_clock)


    def logout(self):
        end_time = time.time()
        duration_mins = max(0, (end_time - self.start_time) / 60)
        report = {
            "username": self.username,
            "password": self.password,
            "fullname": self.fullname,
            "start_time": self.start_time,
            "durationMinutes": duration_mins,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        needs_review = False
        queued_locally = False
        try:
            response = requests.post(f"{API_BASE_URL}/report", json={
                "username": report["username"],
                "password": report["password"],
                "durationMinutes": duration_mins
            }, timeout=10)
            try:
                result = response.json()
            except ValueError:
                result = {}

            if response.ok and isinstance(result, dict) and result.get("success"):
                handled = True
            elif 400 <= response.status_code < 500 or (response.ok and isinstance(result, dict) and result.get("success") is False):
                handled = self.record_unverified_session(report, "Usage report was rejected and requires staff review")
                needs_review = handled
            else:
                handled = self.queue_offline_report(report)
                queued_locally = handled
        except requests.RequestException:
            handled = self.queue_offline_report(report)
            queued_locally = handled

        if not handled:
            self.session_active = True
            messagebox.showerror("Usage Not Saved", "The usage report could not be saved locally or by the server. Keep this session open and contact lab staff.")
            return

        if needs_review:
            messagebox.showwarning("Usage Needs Review", "The server rejected this usage report. A local record was saved for staff reconciliation.")
        elif queued_locally:
            messagebox.showwarning("Usage Saved Locally", "The report is queued for server retry when the client next starts online.")

        # Once the report is stored or accepted, retire the session locally so a
        # rejected report cannot be replayed by restoring the saved kiosk state.
        self.session_active = False
        self.pending_restore = None
        self.clear_state()
        self.username = ""
        self.password = ""
        self.fullname = ""
        self.start_time = 0
        self.setup_lock_screen()

if __name__ == "__main__":
    root = tk.Tk()
    app = OptirKioskApp(root)
    root.mainloop()
