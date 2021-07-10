type MyObjects = Record<string, MyObjectsDefinitions>;

interface MyObjectsDefinitions extends Omit<ioBroker.BaseObject, "_id"> {
	common: MyStateCommon;
}

interface MyStateCommon extends Partial<ioBroker.StateCommon> {
	name: string;
}

const objectDefinitions: MyObjects = {
	"stats": {
		type: "channel",
		common: {
			name: "Stats",
		},
		native: {},
	},
	"stats.dns_queries": {
		type: "state",
		common: {
			name: "Number of DNS queries",
			role: "value",
			type: "number",
			write: false,
			read: true,
		},
		native: {},
	},
	"stats.blocked_filtering": {
		type: "state",
		common: {
			name: "Number of blocked DNS queries",
			role: "valaue",
			type: "number",
			write: false,
			read: true,
		},
		native: {},
	},
};

export { objectDefinitions, MyObjects, MyObjectsDefinitions, MyStateCommon };