const { configPath } = require("./vars.cjs")

let config = {};
try {
    config = require(configPath);
} catch (err) {
    console.warn("[WARN] config.json not found or invalid, using default settings.");
}

const updateConfig = () => {
    let config = {};
    try {
        config = require(configPath);
    } catch (err) {
        console.warn("[WARN] config.json not found or invalid, using default settings.");
    }
}

module.exports = {
    default: config,
    updateConfig
}