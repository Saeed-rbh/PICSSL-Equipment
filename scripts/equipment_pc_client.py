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

        # Attempt to resume an interrupted session
        if self.load_state():
            self.start_session(self.fullname, restoring=True)
        else:
            self.setup_lock_screen()

        # Start offline logs sync in the background
        threading.Thread(target=self.sync_offline_logs, daemon=True).start()

    def sync_offline_logs(self):
        """Attempts to send offline sessions to the server in the background"""
        offline_file = "offline_sessions.jsonl"
        if not os.path.exists(offline_file):
            return
            
        try:
            with open(offline_file, "r") as f:
                lines = f.readlines()
                
            if not lines:
                return
                
            remaining_lines = []
            synced_count = 0
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    response = requests.post(f"{API_BASE_URL}/report", json={
                        "username": data.get("username"),
                        "password": data.get("password"),
                        "durationMinutes": data.get("durationMinutes")
                    }, timeout=10)
                    
                    if response.ok:
                        synced_count += 1
                    else:
                        remaining_lines.append(line + "\n")
                except Exception as e:
                    # If request completely fails (no internet), keep it
                    remaining_lines.append(line + "\n")
                    
            if remaining_lines:
                with open(offline_file, "w") as f:
                    f.writelines(remaining_lines)
            else:
                os.remove(offline_file)
                
            if synced_count > 0:
                print(f"Successfully synced {synced_count} offline sessions to server.")
                
        except Exception as e:
            print(f"Error syncing offline logs: {e}")

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
        """Loads session from disk immediately on boot"""
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, 'r') as f:
                    data = json.load(f)
                if data.get("session_active"):
                    self.username = data.get("username", "")
                    self.password = data.get("password", "")
                    self.fullname = data.get("fullname", "Restored Session")
                    self.start_time = data.get("start_time", time.time())
                    self.session_active = True
                    return True
            except Exception as e:
                print(f"Error loading state: {e}")
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
            response = requests.post(f"{API_BASE_URL}/verify", json={"username": user, "password": pwd}, timeout=10) # Added timeout
            data = response.json()

            if data.get("success"):
                if "data" in data:
                    self.username = user
                    self.password = pwd
                    self.start_session(data['data']['fullName'])
                else:
                    self.status_label.config(text="Error: Missing session data", fg="red")
            else:
                self.status_label.config(text=data.get("message", "Login Failed"), fg="red")
        
        except Exception as e:
            # OFFLINE SAFETY: Check for Admin Override
            if user == "admin" and pwd == "picssl2026":
                self.username = "admin"
                self.password = "picssl2026"
                self.start_session("Offline Admin")
                messagebox.showwarning("Offline Mode", "Network unavailable. Logged in as Admin (Offline).")
                return

            self.status_label.config(text=f"Network Error: {str(e)}", fg="red")

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
        self.session_active = False
        end_time = time.time()
        duration_mins = (end_time - self.start_time) / 60
        
        # Report to API
        report_success = False
        try:
            response = requests.post(f"{API_BASE_URL}/report", json={
                "username": self.username,
                "password": self.password,
                "durationMinutes": duration_mins
            }, timeout=10)
            if response.ok:
                 report_success = True
        except Exception as e:
            # OFFLINE SAFETY: Save to local file
            try:
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                with open("offline_logs.txt", "a") as f:
                    f.write(f"[{timestamp}] User: {self.username} | Duration: {duration_mins:.2f} mins | Error: {str(e)}\n")
                
                # Save structured data for auto-retry
                with open("offline_sessions.jsonl", "a") as f:
                    json.dump({
                        "username": self.username,
                        "password": self.password,
                        "durationMinutes": duration_mins,
                        "timestamp": timestamp
                    }, f)
                    f.write("\n")
                    
                messagebox.showerror("Offline Report", "Network failed. Usage saved locally to 'offline_logs.txt'.")
                report_success = True # Consider successfully saved offline
            except:
                pass 
                
        if report_success:
             self.clear_state() # Unlink the persistence file now that time is accounted for
        
        # Reset memory state
        self.username = ""
        self.password = ""
        self.fullname = ""
        
        # Re-lock
        self.setup_lock_screen()

if __name__ == "__main__":
    root = tk.Tk()
    app = OptirKioskApp(root)
    root.mainloop()
