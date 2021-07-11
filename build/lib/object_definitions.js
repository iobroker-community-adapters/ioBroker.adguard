"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectDefinitions = void 0;
const objectDefinitions = {
    "info": {
        type: "channel",
        common: {
            name: "Information",
        },
        native: {},
    },
    "info.connection": {
        "type": "state",
        "common": {
            "role": "indicator.connected",
            "name": "Device or service connected",
            "type": "boolean",
            "read": true,
            "write": false,
            "def": false
        },
        native: {},
    },
    "stats": {
        type: "channel",
        common: {
            name: "Stats",
        },
        native: {},
    },
    "stats.num_dns_queries": {
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
    "stats.num_blocked_filtering": {
        type: "state",
        common: {
            name: "Number of blocked by filtering DNS queries",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
    "stats.num_replaced_safebrowsing": {
        type: "state",
        common: {
            name: "Number of blocked by safe browsing",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
    "stats.num_replaced_safesearch": {
        type: "state",
        common: {
            name: "Number of safe searches enforced",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
    "stats.num_replaced_parental": {
        type: "state",
        common: {
            name: "Number of requests blocked by parental control",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
    "stats.avg_processing_time": {
        type: "state",
        common: {
            name: "Average response time of AdGuard’s DNS server in milliseconds",
            role: "value",
            type: "number",
            write: false,
            read: true,
            unit: "ms",
        },
        native: {},
    },
    "control": {
        type: "channel",
        common: {
            name: "Control AdGuard",
        },
        native: {},
    },
    "control.safebrowsing": {
        type: "state",
        common: {
            name: "Enable or disable Safe Browsing",
            role: "switch",
            type: "boolean",
            write: true,
            read: true,
        },
        native: {},
    },
    "control.parental": {
        type: "state",
        common: {
            name: "Enable or disable Parental Control",
            role: "switch",
            type: "boolean",
            write: true,
            read: true,
        },
        native: {},
    },
    "control.safesearch": {
        type: "state",
        common: {
            name: "Enable or disable Safe Search",
            role: "switch",
            type: "boolean",
            write: true,
            read: true,
        },
        native: {},
    },
    "control.filtering": {
        type: "state",
        common: {
            name: "Enable or disable filters and hosts files filtering",
            role: "switch",
            type: "boolean",
            write: true,
            read: true,
        },
        native: {},
    },
    "control.adguard_protection": {
        type: "state",
        common: {
            name: "Enable or disable AdGuard Protection (master switch)",
            role: "switch",
            type: "boolean",
            write: true,
            read: true,
        },
        native: {},
    },
};
exports.objectDefinitions = objectDefinitions;
