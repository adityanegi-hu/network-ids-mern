"""
Demo traffic simulator
-----------------------
This does NOT replace ids_sniffer.py — it simulates the alerts
that a real sniffer would generate, so you can see the full
MERN dashboard working live without needing root/raw-socket
access or a live attack to test against.

Run this alongside the backend to populate the dashboard:
    python3 simulate_traffic.py
"""

import time
import random
import requests

API_URL = "http://localhost:5000/api/alerts"

SCENARIOS = [
    {
        "type": "Port Scan",
        "sourceIp": "192.168.1.{}",
        "detail": "{} unique ports probed within 5s",
        "severity": "high"
    },
    {
        "type": "Brute Force",
        "sourceIp": "10.0.0.{}",
        "detail": "{} SSH connection attempts within 10s",
        "severity": "medium"
    },
    {
        "type": "ARP Spoofing",
        "sourceIp": "172.16.0.{}",
        "detail": "MAC address changed from aa:bb:cc:dd:ee:{:02x} to 11:22:33:44:55:{:02x}",
        "severity": "critical"
    }
]


def fire_random_alert():
    scenario = random.choice(SCENARIOS)
    host_id = random.randint(2, 254)
    count = random.randint(16, 40)

    if scenario["type"] == "ARP Spoofing":
        detail = scenario["detail"].format(host_id, random.randint(0, 255))
    else:
        detail = scenario["detail"].format(count)

    payload = {
        "type": scenario["type"],
        "sourceIp": scenario["sourceIp"].format(host_id),
        "detail": detail,
        "severity": scenario["severity"]
    }

    try:
        resp = requests.post(API_URL, json=payload, timeout=2)
        print(f"[SIMULATED] {payload['type']} from {payload['sourceIp']} -> {resp.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] {e}")


if __name__ == "__main__":
    print("Starting traffic simulator -- Ctrl+C to stop")
    print(f"Sending to: {API_URL}\n")
    try:
        while True:
            fire_random_alert()
            time.sleep(random.uniform(2, 5))
    except KeyboardInterrupt:
        print("\nStopped.")
