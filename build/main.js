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
const object_definitions_1 = require("./lib/object_definitions");
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
        this.on("stateChange", this.onStateChange.bind(this));
    }
    async onReady() {
        adapter = this;
        setObjectAndState("info.connection", "info.connection", null, false);
        this.log.debug("config serverAddress: " + this.config.serverAddress);
        this.log.debug("config pollInterval: " + this.config.pollInterval);
        this.log.debug("config user: " + this.config.user);
        this.log.debug("config password: *******");
        axiosOptions = { auth: { username: this.config.user, password: this.config.password } };
        intervalTick(this.config.serverAddress, this.config.pollInterval * 1000);
        this.subscribeStates("control.*");
    }
    async onStateChange(id, state) {
        this.log.debug(`onStateChange-> id:${id} state:${JSON.stringify(state)}`);
        // Ingore Message with ack=true
        try {
            if (!state || state.ack == true) {
                this.log.debug(`onStateChange-> ack is true, change does not need to be processed!`);
                return;
            }
            if (id.endsWith(".filtering")) {
                const jsonBody = JSON.parse(`{"enabled": ${state.val}, "interval": 24}`);
                await axios_1.default.post(new URL("control/filtering/config", this.config.serverAddress).href, jsonBody, axiosOptions);
            }
            else if (id.endsWith(".adguard_protection")) {
                const jsonBody = JSON.parse(`{"protection_enabled": ${state.val}}`);
                await axios_1.default.post(new URL("control/dns_config", this.config.serverAddress).href, jsonBody, axiosOptions);
            }
            else {
                await axios_1.default.post(new URL(`control/${id.split(".").slice(-1)[0]}/${state.val == true ? "enable" : "disable"}`, this.config.serverAddress).href, null, axiosOptions);
            }
            this.setStateAsync(id, { val: state.val, ack: true });
        }
        catch (error) {
            adapter.log.error(`onStateChange-> error:${error}`);
        }
    }
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
    setObjectAndState("info.connection", "info.connection", null, true);
    if (currentTimeout) {
        clearTimeout(currentTimeout);
    }
    try {
        //const response = (await axios.get(apiUrl.href,axiosOptions)).data;
        const responses = await axios_1.default.all([
            axios_1.default.get(new URL("control/stats", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/safebrowsing/status", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/parental/status", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/safesearch/status", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/filtering/status", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/dns_info", serverAddress).href, axiosOptions)
        ]);
        const stats = responses[0].data;
        const control = {
            safebrowsing: responses[1].data,
            parental: responses[2].data,
            safesearch: responses[3].data,
            filtering: responses[4].data,
            adguard_protection: responses[5].data
        };
        // Channels erstellen
        await setObjectAndState("stats", "stats", null, null);
        await setObjectAndState("control", "control", null, null);
        for (const key in stats) {
            if (Object.prototype.hasOwnProperty.call(stats, key)) {
                let value = stats[key];
                if (key == "avg_processing_time") {
                    value = Math.round(Number(stats[key]) * 1000);
                }
                setObjectAndState(`stats.${key}`, `stats.${key}`, null, value);
            }
        }
        for (const key in control) {
            if (key == "adguard_protection") {
                setObjectAndState(`control.${key}`, `control.${key}`, null, control[key].protection_enabled);
            }
            else {
                setObjectAndState(`control.${key}`, `control.${key}`, null, control[key].enabled);
            }
        }
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
    setObjectAndState("info.connection", "info.connection", null, false);
}
async function setObjectAndState(objectId, stateId, stateName, value) {
    const obj = object_definitions_1.objectDefinitions[objectId];
    if (!obj) {
        return;
    }
    if (stateName !== null) {
        obj.common.name = stateName;
    }
    await adapter.setObjectNotExistsAsync(stateId, {
        type: obj.type,
        common: JSON.parse(JSON.stringify(obj.common)),
        native: JSON.parse(JSON.stringify(obj.native)),
    });
    if (value !== null) {
        adapter.setStateChangedAsync(stateId, {
            val: value,
            ack: true,
        });
    }
}
