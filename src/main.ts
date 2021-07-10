/*
 * Created with @iobroker/create-adapter v1.33.0
 */

import * as utils from "@iobroker/adapter-core";
import axios, { AxiosRequestConfig } from "axios";

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

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		adapter = this;
		this.setState("info.connection", false, true);
		this.log.info("config serverAddress: " + this.config.serverAddress);
		this.log.info("config pollInterval: " + this.config.pollInterval);
		this.log.info("config user: " + this.config.user);
		this.log.info("config password: " + this.config.password);

		axiosOptions = { auth: {username: this.config.user, password: this.config.password}};

		intervalTick(this.config.serverAddress, this.config.pollInterval * 1000);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
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
	adapter.setState("info.connection", true, true);
	if (currentTimeout) {
		clearTimeout(currentTimeout);
	}
	const apiUrl = new URL("control/stats", serverAddress);
	try {
		const response = (await axios.get(apiUrl.href,axiosOptions)).data;
		adapter.log.info(`response	: ${JSON.stringify(response)}`);
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
	adapter.setStateChanged("info.connection", false, true);
}

