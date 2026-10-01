import contextlib
import importlib.util
import io
import json
import os
import sys
import tempfile
import threading
import time
import types
import unittest
from importlib.machinery import SourceFileLoader
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]


def load_kiosk_clients():
    requests_stub = types.ModuleType("requests")
    requests_stub.RequestException = type("RequestException", (Exception,), {})
    requests_stub.post = lambda *args, **kwargs: None

    tkinter_stub = types.ModuleType("tkinter")
    tkinter_stub.__path__ = []
    messagebox_stub = types.ModuleType("tkinter.messagebox")
    tkinter_stub.messagebox = messagebox_stub

    previous_modules = {
        name: sys.modules.get(name)
        for name in ("requests", "tkinter", "tkinter.messagebox")
    }
    sys.modules["requests"] = requests_stub
    sys.modules["tkinter"] = tkinter_stub
    sys.modules["tkinter.messagebox"] = messagebox_stub

    clients = []
    try:
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            for name, relative_path in (
                ("kiosk_py", "scripts/equipment_pc_client.py"),
                ("kiosk_pyw", "scripts/equipment_pc_client.pyw"),
            ):
                loader = SourceFileLoader(name, str(REPOSITORY_ROOT / relative_path))
                spec = importlib.util.spec_from_loader(name, loader)
                module = importlib.util.module_from_spec(spec)
                loader.exec_module(module)
                clients.append((name, module))
    finally:
        for name, previous in previous_modules.items():
            if previous is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = previous
    return clients


class OfflineQueueRaceTest(unittest.TestCase):
    def test_logout_append_survives_concurrent_retry_in_both_clients(self):
        for name, module in load_kiosk_clients():
            for outcome in ("accepted", "temporary-failure", "rejected"):
                with self.subTest(client=name, older_report=outcome), tempfile.TemporaryDirectory() as temporary_directory:
                    previous_directory = os.getcwd()
                    os.chdir(temporary_directory)
                    try:
                        old_report = {
                            "username": "older-reservation",
                            "password": "test-only-old-password",
                            "durationMinutes": 12,
                        }
                        Path("offline_sessions.jsonl").write_text(
                            json.dumps(old_report) + "\n", encoding="utf-8"
                        )

                        request_started = threading.Event()
                        allow_request_to_finish = threading.Event()
                        logout_finished = threading.Event()
                        logout_errors = []
                        request_count = 0
                        request_count_lock = threading.Lock()

                        class Response:
                            def __init__(self):
                                self.ok = outcome == "accepted"
                                self.status_code = 200 if outcome == "accepted" else 401 if outcome == "rejected" else 503

                            @staticmethod
                            def json():
                                return {"success": outcome == "accepted"}

                        old_post = module.requests.post
                        old_warning = getattr(module.messagebox, "showwarning", None)
                        old_error = getattr(module.messagebox, "showerror", None)

                        def blocked_post(*args, **kwargs):
                            nonlocal request_count
                            with request_count_lock:
                                request_count += 1
                                current_request = request_count
                            if current_request == 1:
                                request_started.set()
                                if not allow_request_to_finish.wait(timeout=5):
                                    raise TimeoutError("test did not release the simulated request")
                                return Response()
                            raise module.requests.RequestException("simulated offline logout")

                        module.requests.post = blocked_post
                        module.messagebox.showwarning = lambda *args, **kwargs: None
                        module.messagebox.showerror = lambda *args, **kwargs: None
                        app = module.OptirKioskApp.__new__(module.OptirKioskApp)
                        app.username = "logout-reservation"
                        app.password = "test-only-new-password"
                        app.fullname = "Test User"
                        app.start_time = time.time() - 240
                        app.session_active = True
                        app.setup_lock_screen = lambda: None
                        if name == "kiosk_py":
                            app.pending_restore = None
                        sync_thread = threading.Thread(target=app.sync_offline_logs)
                        logout_thread = None
                        sync_thread.start()

                        try:
                            self.assertTrue(request_started.wait(timeout=2), "sync did not start its request")

                            def logout_session():
                                try:
                                    app.logout()
                                except Exception as error:
                                    logout_errors.append(error)
                                finally:
                                    logout_finished.set()

                            logout_thread = threading.Thread(target=logout_session)
                            logout_thread.start()
                            self.assertTrue(
                                logout_finished.wait(timeout=2),
                                "logout append was blocked by the in-flight network request",
                            )
                            self.assertEqual(logout_errors, [])
                            self.assertFalse(app.session_active, "logout did not retire its session")
                        finally:
                            allow_request_to_finish.set()
                            sync_thread.join(timeout=5)
                            if logout_thread is not None:
                                logout_thread.join(timeout=5)
                            module.requests.post = old_post
                            if old_warning is None:
                                delattr(module.messagebox, "showwarning")
                            else:
                                module.messagebox.showwarning = old_warning
                            if old_error is None:
                                delattr(module.messagebox, "showerror")
                            else:
                                module.messagebox.showerror = old_error

                        self.assertFalse(sync_thread.is_alive(), "sync did not finish")
                        self.assertFalse(logout_thread.is_alive(), "logout did not finish")
                        remaining = [
                            json.loads(line)
                            for line in Path("offline_sessions.jsonl").read_text(encoding="utf-8").splitlines()
                        ]
                        expected = ["logout-reservation"]
                        if outcome == "temporary-failure":
                            expected.append("older-reservation")
                        self.assertEqual([record["username"] for record in remaining], expected)

                        if outcome == "rejected":
                            review = json.loads(Path("unverified_sessions.jsonl").read_text(encoding="utf-8"))
                            self.assertEqual(review["username"], "older-reservation")
                            self.assertNotIn("password", review)

                        self.assertEqual(
                            list(Path(temporary_directory).glob("offline_sessions.jsonl.batch-*")), []
                        )
                    finally:
                        os.chdir(previous_directory)


if __name__ == "__main__":
    unittest.main()
