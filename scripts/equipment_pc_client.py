import tkinter as tk
from tkinter import messagebox
import requests
import time
import threading

# CONFIGURATION
API_BASE_URL = "https://picssle-quipment--pic-equipment.us-east4.hosted.app/api/access"  # Update this to your deployed URL


# SCREEN CONFIGURATION (Adjust for your specific monitors)
PRIMARY_W = 1920
SECONDARY_W = 1920
SECONDARY_H = 1080
WIN_W = 300
WIN_H = 120
PAD = 20

# Position: Bottom-Right of 2nd Monitor (Assuming 2nd is right of Primary)
POS_X = PRIMARY_W + SECONDARY_W - WIN_W - PAD
POS_Y = SECONDARY_H - WIN_H - PAD

class OptirKioskApp:
    def __init__(self, root):
        self.root = root
        self.root.title("OPTIR Access Control")
        self.setup_lock_screen()
        
        # State
        self.username = ""
        self.password = ""
        self.start_time = 0
        self.session_active = False

    def setup_lock_screen(self):
        # Configure full screen / locked mode
        self.root.attributes("-fullscreen", True)
        self.root.attributes("-topmost", True)
        self.root.overrideredirect(True) # Removes title bar
        self.root.configure(bg="#0d1117")

        # Disable Alt+F4 (Soft prevention)
        self.root.protocol("WM_DELETE_WINDOW", lambda: None)
        
        # Ensure the root window is updated so we get correct screen dimensions
        self.root.update_idletasks()
        
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
            "1. Reserve a time slot using the OPTIR Web Portal.",
            "2. Use the credentials provided in your booking to UNLOCK this station.",
            "3. Your session is timed.",
            "4. When finished, strictly click 'Log Out' on the timer window.",
            "5. The system will calculate usage cost based on duration."
        ]

        for line in instructions:
            tk.Label(frame2, text=line, font=("Arial", 16), fg="#c9d1d9", bg="black", wraplength=800, justify="left").pack(anchor="w", pady=5)



    def verify_login(self):
        user = self.entry_user.get()
        pwd = self.entry_pass.get()
        self.status_label.config(text="Verifying...", fg="#58a6ff")
        self.root.update()

        try:
            response = requests.post(f"{API_BASE_URL}/verify", json={"username": user, "password": pwd})
            data = response.json()

            if data.get("success"):
                self.username = user
                self.password = pwd
                self.start_session(data['data']['fullName'])
            else:
                self.status_label.config(text=data.get("message", "Login Failed"), fg="red")
        
        except Exception as e:
            self.status_label.config(text=f"Network Error: {str(e)}", fg="red")

    def start_session(self, fullname):
        # "Unlock": Destroy lock screen elements and show session timer
        for widget in self.root.winfo_children():
            widget.destroy()

        # Destroy the secondary lock window if it exists
        if hasattr(self, 'win2') and self.win2:
            self.win2.destroy()


        self.root.attributes("-fullscreen", False)
        self.root.attributes("-topmost", True) # Keep timer on top
        self.root.overrideredirect(True)
        # Position on 2nd monitor bottom-right
        self.root.geometry(f"{WIN_W}x{WIN_H}+{POS_X}+{POS_Y}") 
        self.root.configure(bg="#333")

        self.start_time = time.time()
        self.session_active = True

        # Session UI
        tk.Label(self.root, text=f"User: {fullname}", fg="white", bg="#333").pack(pady=(10, 5))
        
        self.timer_label = tk.Label(self.root, text="00:00", font=("Courier", 30, "bold"), fg="#58a6ff", bg="#333")
        self.timer_label.pack()

        btn_logout = tk.Button(self.root, text="Log Out & Lock", command=self.logout, bg="red", fg="white", bd=0, padx=10)
        btn_logout.pack(pady=10)

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
        try:
            requests.post(f"{API_BASE_URL}/report", json={
                "username": self.username,
                "password": self.password,
                "durationMinutes": duration_mins
            })
        except:
            pass # Fail silently or log error
        
        # Re-lock
        self.setup_lock_screen()

if __name__ == "__main__":
    root = tk.Tk()
    app = OptirKioskApp(root)
    root.mainloop()
