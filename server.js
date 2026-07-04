const { WebSocketServer } = require('ws');
const { Jimp, ResizeStrategy } = require('jimp');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Encodes an integer as a VarInt.
 * This is the standard data type used in the Minecraft protocol.
 * 
 * @param {number} val - The integer to encode.
 * @returns {Buffer} The encoded VarInt buffer.
 */
function writeVarInt(val) {
    const bytes = [];
    while (true) {
        if ((val & ~0x7F) === 0) {
            bytes.push(val);
            return Buffer.from(bytes);
        }
        bytes.push((val & 0x7F) | 0x80);
        val >>>= 7;
    }
}

/**
 * Encodes a string as a VarInt-prefixed UTF-8 byte array.
 * 
 * @param {string} str - The string to encode.
 * @returns {Buffer} The encoded string buffer.
 */
function writeString(str) {
    const strBuffer = Buffer.from(str, 'utf8');
    const lenBuffer = writeVarInt(strBuffer.length);
    return Buffer.concat([lenBuffer, strBuffer]);
}

/**
 * Loads the server icon from the filesystem and converts it to a raw RGBA buffer
 * required by the Eaglercraft MOTD protocol.
 * 
 * @returns {Promise<Buffer|null>} The 64x64 RGBA buffer, or null if loading fails.
 */
async function loadServerIcon() {
    const iconPath = 'server-icon.png';
    
    if (!fs.existsSync(iconPath)) {
        return null;
    }

    try {
        const image = await Jimp.read(iconPath);
        
        // Eaglercraft expects exactly 64x64 pixels
        image.resize({ w: 64, h: 64, mode: ResizeStrategy.NEAREST_NEIGHBOR });
        
        const rawBuffer = Buffer.alloc(64 * 64 * 4);
        const { data: bitmap } = image.bitmap;
        
        // Copy pixels into the new buffer (RGBA format)
        for (let i = 0; i < 64 * 64; i++) {
            const offset = i * 4;
            rawBuffer[offset] = bitmap[offset];         // R
            rawBuffer[offset + 1] = bitmap[offset + 1]; // G
            rawBuffer[offset + 2] = bitmap[offset + 2]; // B
            rawBuffer[offset + 3] = bitmap[offset + 3]; // A
        }
        
        return rawBuffer;
    } catch (err) {
        console.warn(`[WARN] Failed to load ${iconPath}:`, err.message);
        return null;
    }
}

/**
 * Constructs the Eaglercraft SCDisconnect packet.
 * 
 * @param {string} reason - The disconnect reason/message.
 * @returns {Buffer} The constructed packet buffer.
 */
function buildDisconnectPacket(reason) {
    return Buffer.concat([
        Buffer.from([0xff]), // SCDisconnectPacket ID
        writeVarInt(8),      // Reason ID (Eaglercraft specific)
        writeString(` ${reason} `) // Eaglercraft proxy typically pads with spaces
    ]);
}

async function bootstrap() {
    const PORT = process.env.PORT || 8080;
    const wss = new WebSocketServer({ port: PORT });
    const serverUuid = crypto.randomUUID();

    console.log(`[INFO] Eaglercraft Maintenance Server starting on port ${PORT}...`);

    wss.on('connection', async (ws) => {
        ws.on('message', async (message) => {
            try {
                const payload = message.toString('utf8');
                
                // Handle MOTD (Server List Ping) request
                if (payload.toLowerCase().startsWith('accept: motd')) {
                    const iconBuffer = await loadServerIcon();
                    
                    const motdResponse = {
                        brand: "EaglerProxy",
                        cracked: true,
                        data: {
                            cache: true,
                            icon: iconBuffer !== null,
                            max: 0,
                            motd: [
                                "§c現在メンテナンス中です。", 
                                "§eしばらくしてから再度お試しください。"
                            ],
                            online: 0,
                            players: []
                        },
                        name: "Maintenance Server",
                        secure: false,
                        time: Date.now(),
                        type: "motd",
                        uuid: serverUuid,
                        vers: "EaglerProxy/1.0"
                    };
                    
                    // Send JSON metadata
                    ws.send(JSON.stringify(motdResponse));
                    
                    // Send raw icon data if available
                    if (iconBuffer) {
                        ws.send(iconBuffer);
                    }
                    
                    ws.close();
                    return;
                } 
                
                // Handle actual login attempts
                const kickMessage = "§cサーバーは現在メンテナンス中です。しばらくしてから再度アクセスしてください。";
                const disconnectPacket = buildDisconnectPacket(kickMessage);
                
                ws.send(disconnectPacket);
                ws.close();
                
            } catch (err) {
                console.error("[ERROR] Failed to handle incoming message:", err);
                ws.close();
            }
        });
        
        ws.on('error', (err) => {
            console.error("[ERROR] WebSocket connection error:", err.message);
        });
    });
}

bootstrap().catch(console.error);
