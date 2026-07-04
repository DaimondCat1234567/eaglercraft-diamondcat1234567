# Eaglercraft Maintenance Server

A lightweight Node.js WebSocket server designed to act as a placeholder for EaglercraftX servers during maintenance.

## Features
- Complete compliance with the Eaglercraft WebSocket protocol.
- Answers Server List Ping (MOTD requests) with a custom maintenance message.
- Supports displaying a server icon (`server-icon.png`).
- Disconnects joining players instantly with a customizable maintenance kick message.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Place your 64x64 icon file named `server-icon.png` in the root directory.
3. Start the server:
   ```bash
   node server.js
   ```

## Configuration
The server runs on port `8080` by default. You can change this by setting the `PORT` environment variable:
```bash
PORT=3000 node server.js
```

You can customize the MOTD and kick messages directly in `server.js`.
