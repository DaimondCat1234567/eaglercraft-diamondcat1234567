# Server

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
The server runs on port `8080` by default. You can change this by setting the `PORT` environment variable, or `config.json`:
```bash
PORT=3000 node server.js
```

You can customize the MOTD and kick messages directly in `config.json`.
