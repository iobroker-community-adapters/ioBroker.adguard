"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectDefinitions = void 0;
const objectDefinitions = {
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
    "stats.replaced_safebrowsing": {
        type: "state",
        common: {
            name: "Number of requests replaced by safe browsing",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
    "sites.site.actions": {
        type: "state",
        common: {
            name: "Actions last 3 minutes",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
    "sites.site.visitors": {
        type: "state",
        common: {
            name: "Visitors last 3 minutes",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
    "sites.site.nb_visits": {
        type: "state",
        common: {
            name: "Number of visits today",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
    "sites.site.nb_actions": {
        type: "state",
        common: {
            name: "Number of actions today",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
    "sites.site.nb_pageviews": {
        type: "state",
        common: {
            name: "Number of pageviews today",
            role: "value",
            type: "number",
            write: false,
            read: true,
        },
        native: {},
    },
};
exports.objectDefinitions = objectDefinitions;
