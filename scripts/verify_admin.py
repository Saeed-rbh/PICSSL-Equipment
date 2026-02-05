import requests

API_URL = "https://picssle-quipment--pic-equipment.us-east4.hosted.app/api/access/verify"

def test_admin_login():
    print(f"Testing Admin Login against: {API_URL}")
    try:
        response = requests.post(API_URL, json={
            "username": "admin",
            "password": "picssl2026"
        })
        
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(response.json())
        
        if response.status_code == 200 and response.json().get("success"):
            print("\n✅ Admin Login Verification SUCCESSFUL")
        else:
            print("\n❌ Admin Login Verification FAILED")

    except Exception as e:
        print(f"\n❌ request failed: {e}")

if __name__ == "__main__":
    test_admin_login()
