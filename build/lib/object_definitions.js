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
};
exports.objectDefinitions = objectDefinitions;
