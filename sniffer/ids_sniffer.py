"""
Network IDS sniffer
--------------------
Captures live traffic with Scapy, runs three detection rules
(port scan, brute force, ARP spoofing), and POSTs any alert it
finds to the Node/Express backend, which broadcasts it to the
React dashboard over Socket.io in real time.

Run with: sudo python3 ids_sniffer.py
(root is required for raw socket / packet capture access)
"""

import time
import requests
from collections import defaultdict
from scapy.all import sniff, IP, TCP, ARP

API_URL = "http://localhost:5000/api/alerts"

# ---------- tunable thresholds ----------
PORT_SCAN_THRESHOLD = 15      # unique ports from one source
PORT_SCAN_WINDOW = 5          # seconds
BRUTE_FORCE_THRESHOLD = 5     # connection attempts
BRUTE_FORCE_WINDOW = 10       # seconds
WATCHED_AUTH_PORTS = [22, 21, 3389, 23]  # SSH, FTP, RDP, Telnet

# ---------- tracking state ----------
port_tracker = defaultdict(list)   # src_ip -> [(port, timestamp), ...]
auth_tracker = defaultdict(list)   # src_ip -> [timestamp, ...]
arp_table = {}                     # ip -> mac

# avoid spamming the same alert every packet
recent_alerts = {}
ALERT_COOLDOWN = 15  # seconds before the same alert type+source can fire again


def send_alert(alert_type, source_ip, detail, severity="medium"):
    key = f"{alert_type}:{source_ip}"
    now = time.time()
    if key in recent_alerts and now - recent_alerts[key] < ALERT_COOLDOWN:
        return
    recent_alerts[key] = now

    payload = {
        "type": alert_type,
        "sourceIp": source_ip,
        "detail": detail,
        "severity": severity
    }
    try:
        resp = requests.post(API_URL, json=payload, timeout=2)
        print(f"[ALERT SENT] {alert_type} from {source_ip} -- {detail} ({resp.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Could not reach backend: {e}")


def detect_port_scan(packet):
    if packet.haslayer(TCP) and packet.haslayer(IP):
        src = packet[IP].src
        dport = packet[TCP].dport
        now = time.time()

        port_tracker[src].append((dport, now))
        port_tracker[src] = [(p, t) for p, t in port_tracker[src] if now - t < PORT_SCAN_WINDOW]

        unique_ports = len(set(p for p, t in port_tracker[src]))
        if unique_ports > PORT_SCAN_THRESHOLD:
            send_alert(
                "Port Scan", src,
                f"{unique_ports} unique ports probed within {PORT_SCAN_WINDOW}s",
                severity="high"
            )


def detect_bruteforce(packet):
    if packet.haslayer(TCP) and packet.haslayer(IP):
        dport = packet[TCP].dport
        if dport in WATCHED_AUTH_PORTS:
            src = packet[IP].src
            now = time.time()

            auth_tracker[src].append(now)
            auth_tracker[src] = [t for t in auth_tracker[src] if now - t < BRUTE_FORCE_WINDOW]

            if len(auth_tracker[src]) > BRUTE_FORCE_THRESHOLD:
                send_alert(
                    "Brute Force", src,
                    f"{len(auth_tracker[src])} connection attempts on port {dport} within {BRUTE_FORCE_WINDOW}s",
                    severity="medium"
                )


def detect_arp_spoof(packet):
    if packet.haslayer(ARP) and packet[ARP].op == 2:  # is-at (reply)
        ip = packet[ARP].psrc
        mac = packet[ARP].hwsrc

        if ip in arp_table and arp_table[ip] != mac:
            send_alert(
                "ARP Spoofing", ip,
                f"MAC address changed from {arp_table[ip]} to {mac}",
                severity="critical"
            )
        arp_table[ip] = mac


def process_packet(packet):
    detect_port_scan(packet)
    detect_bruteforce(packet)
    detect_arp_spoof(packet)


if __name__ == "__main__":
    print("Network IDS sniffer starting...")
    print(f"Posting alerts to: {API_URL}")
    print("Press Ctrl+C to stop.\n")
    sniff(prn=process_packet, store=False)
