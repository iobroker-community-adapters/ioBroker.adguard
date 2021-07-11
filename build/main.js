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
let serverAddress;
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
        // Check the server address was passed with http or https
        if (this.config.serverAddress.startsWith("http")) {
            serverAddress = this.config.serverAddress;
        }
        else {
            // If not append http
            serverAddress = "http://" + this.config.serverAddress;
        }
        // Set authtenfication in axios options
        axiosOptions = { auth: { username: this.config.user, password: this.config.password } };
        // Start interval
        intervalTick(this.config.pollInterval * 1000);
        // Subscribe changes in adapter.N.control
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
            // Process filtering change, for this state the API expects a JSON
            if (id.endsWith(".filtering")) {
                const jsonBody = JSON.parse(`{"enabled": ${state.val}, "interval": 24}`);
                await axios_1.default.post(new URL("control/filtering/config", serverAddress).href, jsonBody, axiosOptions);
            }
            // Process adguard_protection change, for this state the API expects a JSON
            else if (id.endsWith(".adguard_protection")) {
                const jsonBody = JSON.parse(`{"protection_enabled": ${state.val}}`);
                await axios_1.default.post(new URL("control/dns_config", serverAddress).href, jsonBody, axiosOptions);
            }
            // Process all other changes in control.*, here a simple call is sufficient
            else {
                await axios_1.default.post(new URL(`control/${id.split(".").slice(-1)[0]}/${state.val == true ? "enable" : "disable"}`, serverAddress).href, null, axiosOptions);
            }
            // Only set ack to true if the call was successful
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
async function intervalTick(pollInterval) {
    // First set info.connection to true
    setObjectAndState("info.connection", "info.connection", null, true);
    // Check if a timeout is still active, delete it if necessary.
    if (currentTimeout) {
        clearTimeout(currentTimeout);
    }
    try {
        // API asynchronous pollen
        const responses = await axios_1.default.all([
            axios_1.default.get(new URL("control/stats", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/safebrowsing/status", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/parental/status", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/safesearch/status", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/filtering/status", serverAddress).href, axiosOptions),
            axios_1.default.get(new URL("control/dns_info", serverAddress).href, axiosOptions)
        ]);
        // Prepare responses in order to be able to use them better
        const stats = responses[0].data;
        // Calculate ratio blocks filtering
        stats.ratio_blocked_filtering = Math.round((stats.num_blocked_filtering / stats.num_dns_queries) * 10000) / 100;
        const control = {
            safebrowsing: responses[1].data,
            parental: responses[2].data,
            safesearch: responses[3].data,
            filtering: responses[4].data,
            adguard_protection: responses[5].data
        };
        // Create channels
        await setObjectAndState("stats", "stats", null, null);
        await setObjectAndState("control", "control", null, null);
        // Create Stats states and set value
        for (const key in stats) {
            if (Object.prototype.hasOwnProperty.call(stats, key)) {
                let value = stats[key];
                // Convert value of avg_processing_time to miliseconds
                if (key == "avg_processing_time") {
                    value = Math.round(Number(stats[key]) * 1000);
                }
                setObjectAndState(`stats.${key}`, `stats.${key}`, null, value);
            }
        }
        // Create Control states and set value
        for (const key in control) {
            // adguard_protection has other properties
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
        intervalTick(pollInterval);
    }, pollInterval);
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
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Adguard(options);
}
else {
    // otherwise start the instance directly
    (() => new Adguard())();
}
