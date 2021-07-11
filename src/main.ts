/*
 * Created with @iobroker/create-adapter v1.33.0
 */

import * as utils from "@iobroker/adapter-core";
import axios, { AxiosRequestConfig } from "axios";
import { MyObjectsDefinitions, objectDefinitions } from "./lib/object_definitions";

let adapter: ioBroker.Adapter;
let currentTimeout: NodeJS.Timeout;
let axiosOptions: AxiosRequestConfig;

class Adguard extends utils.Adapter {

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "adguard",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	private async onReady(): Promise<void> {
		adapter = this;
		setObjectAndState("info.connection", "info.connection", null, false);
		this.log.debug("config serverAddress: " + this.config.serverAddress);
		this.log.debug("config pollInterval: " + this.config.pollInterval);
		this.log.debug("config user: " + this.config.user);
		this.log.debug("config password: *******");

		axiosOptions = { auth: {username: this.config.user, password: this.config.password}};

		intervalTick(this.config.serverAddress, this.config.pollInterval * 1000);
	}

	private onUnload(callback: () => void): void {
		try {
			clearTimeout(currentTimeout);
			callback();
		} catch (e) {
			callback();
		}
	}

}

async function intervalTick(serverAddress: string, pollInterval: number): Promise<void> {
	setObjectAndState("info.connection", "info.connection", null, true);
	if (currentTimeout) {
		clearTimeout(currentTimeout);
	}
	const apiUrl = new URL("control/stats", serverAddress);
	try {
		const response = (await axios.get(apiUrl.href,axiosOptions)).data;
		// Channel erstellen
		await setObjectAndState("stats", "stats", null, null);

		// SiteStats Propertys durchlaufen und in State schreiben
		for (const key in response) {
			if (Object.prototype.hasOwnProperty.call(response, key)) {
				let value = response[key];
				if (key == "avg_processing_time"){
					value = Math.round(Number(response[key]) * 1000);
				}
				setObjectAndState(`stats.${key}`, `stats.${key}`, null, value);
			}
		}

	} catch (e) {
		throwWarn(e);
	}

	currentTimeout = setTimeout(async () => {
		intervalTick(serverAddress, pollInterval);
	}, pollInterval);
}


if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Adguard(options);
} else {
	// otherwise start the instance directly
	(() => new Adguard())();
}

function throwWarn(error: any): void {
	let errorMessage = error;

	if (error.response && error.response.data && error.response.data.message) {
		errorMessage = error.response.data.message;
	}

	adapter.log.warn(`No connection to the server could be established. (${errorMessage})`);
	setObjectAndState("info.connection", "info.connection", null, false);
}

async function setObjectAndState(objectId: string, stateId: string, stateName: string | null, value: any | null): Promise<void> {
	const obj: MyObjectsDefinitions = objectDefinitions[objectId];

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