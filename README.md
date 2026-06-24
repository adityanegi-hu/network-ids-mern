# Sentinel — Network Intrusion Detection System (MERN + Python)

A full-stack network IDS: a Python/Scapy sniffer detects port scans,
brute-force attempts, and ARP spoofing on the wire, streams alerts to
a Node/Express + MongoDB backend, and a React dashboard shows them
live over Socket.io.

```
network-ids-mern/
├── backend/          Express API + MongoDB models + Socket.io server
├── frontend/          React dashboard (Vite)
└── sniffer/           Python detection engine + traffic simulator
```

## Architecture

```
Scapy sniffer (Python, root)
        │  POST /api/alerts
        ▼
Express API ──────────────► MongoDB (alerts collection)
        │  io.emit('new_alert')
        ▼
React dashboard (Socket.io client, live feed)
```

## 1. Backend setup

Requires MongoDB running locally (or a connection string to Atlas).

```bash
cd backend
npm install
cp .env.example .env        # edit MONGO_URI if not running Mongo locally
npm start                   # runs on http://localhost:5000
```

**Don't have MongoDB installed?** Run `npm run sandbox` instead — this
uses `server.sandbox.js`, which swaps in an in-memory datastore behind
the exact same API. Good for trying the dashboard before setting up
real Mongo. Swap back to `npm start` once Mongo is installed for actual.
persistence.

To install MongoDB locally:
- **Ubuntu/Debian**: `sudo apt install mongodb`, or follow the [official MongoDB docs](https://www.mongodb.com/docs/manual/installation/)
- **Mac**: `brew tap mongodb/brew && brew install mongodb-community`
- **Easiest option**: use a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and paste the connection string into `.env`

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev                 # runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser

## 3. Run the detection engine

The real sniffer needs raw socket access, so run it with root:

```bash
cd sniffer
pip install scapy requests
sudo python3 ids_sniffer.py
```

It will sniff live traffic on your default interface and POST any
detected alert to the backend.

**No live attack traffic to test against?** Run the simulator instead —
it sends realistic fake alerts so you can see the full dashboard work
end-to-end without needing to actually attack anything:

```bash
python3 simulate_traffic.py
```

## Testing detections for real

Run these from a **second machine or VM** on the same network as the
one running the sniffer (never against systems you don't own):

| Detection | How to trigger it |
|---|---|
| Port Scan | `nmap -sS <target-ip>` |
| Brute Force | Repeated SSH connection attempts to port 22 |
| ARP Spoofing | `arpspoof -i eth0 -t <target-ip> <gateway-ip>` (lab VM only) |

## API reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/alerts` | List alerts (supports `?type=`, `?severity=`, `?status=`, `?limit=`) |
| GET | `/api/alerts/stats` | Summary counts for the dashboard |
| POST | `/api/alerts` | Create a new alert (used by the sniffer) |
| PATCH | `/api/alerts/:id` | Update alert status (`acknowledged` / `resolved`) |
| DELETE | `/api/alerts/:id` | Delete an alert |

## Detection logic

- **Port Scan** — flags a source IP if it touches more than 15 unique
  destination ports within a 5-second window (classic SYN scan signature).
- **Brute Force** — flags a source IP making more than 5 connection
  attempts to an auth port (SSH/FTP/RDP/Telnet) within 10 seconds.
- **ARP Spoofing** — maintains an IP→MAC table from observed ARP
  replies; flags any IP whose MAC address changes (classic MITM signature).

All thresholds are tunable constants at the top of `ids_sniffer.py`.

## Resume bullet

> Built a full-stack network intrusion detection system (Python/Scapy
> detection engine, Express/MongoDB API, React + Socket.io real-time
> dashboard) implementing custom detection logic for port scanning,
> brute-force, and ARP spoofing attacks with live alerting and
> severity-based triage.
