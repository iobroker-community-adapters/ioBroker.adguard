"use strict";
/*
 * Created with @iobroker/create-adapter v1.33.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("@iobroker/adapter-core"));
const axios_1 = __importDefault(require("axios"));
let adapter;
let currentTimeout;
let axiosOptions;
class Adguard extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: "adguard",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        adapter = this;
        this.setState("info.connection", false, true);
        this.log.info("config serverAddress: " + this.config.serverAddress);
        this.log.info("config pollInterval: " + this.config.pollInterval);
        this.log.info("config user: " + this.config.user);
        this.log.info("config password: " + this.config.password);
        axiosOptions = { auth: { username: this.config.user, password: this.config.password } };
        intervalTick(this.config.serverAddress, this.config.pollInterval * 1000);
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            clearTimeout(currentTimeout);
            callback();
        }
        catch (e) {
            callback();
        }
    }
}
async function intervalTick(serverAddress, pollInterval) {
    adapter.setState("info.connection", true, true);
    if (currentTimeout) {
        clearTimeout(currentTimeout);
    }
    const apiUrl = new URL("control/stats", serverAddress);
    try {
        const response = (await axios_1.default.get(apiUrl.href, axiosOptions)).data;
        adapter.log.info(`response	: ${JSON.stringify(response)}`);
    }
    catch (e) {
        throwWarn(e);
    }
    currentTimeout = setTimeout(async () => {
        intervalTick(serverAddress, pollInterval);
    }, pollInterval);
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Adguard(options);
}
else {
    // otherwise start the instance directly
    (() => new Adguard())();
}
function throwWarn(error) {
    let errorMessage = error;
    if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
    }
    adapter.log.warn(`No connection to the server could be established. (${errorMessage})`);
    adapter.setStateChanged("info.connection", false, true);
}
