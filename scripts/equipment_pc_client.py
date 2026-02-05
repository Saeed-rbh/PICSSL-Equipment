import tkinter as tk
from tkinter import messagebox
import requests
import time
import threading

# CONFIGURATION
API_BASE_URL = "http://localhost:3000/api/access"  # Update this to your deployed URL

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

        self.root.attributes("-fullscreen", False)
        self.root.attributes("-topmost", True) # Keep timer on top
        self.root.overrideredirect(True)
        self.root.geometry("300x120+50+50") # Small window in top-left
        self.root.configure(bg="#333")

        self.start_time = time.time()
        self.session_active = True

        # Session UI
        tk.Label(self.root, text=f"User: {fullname}", fg="white", bg="#333").pack(pady=(10, 5))
        
        self.timer_label = tk.Label(self.root, text="00:00:00", font=("Courier", 20, "bold"), fg="#58a6ff", bg="#333")
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
            self.timer_label.config(text=f"{hours:02}:{mins:02}:{secs:02}")
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
