#! /usr/bin/env node

'use strict';

let yargs = require('yargs');

// server-st -p 8080
let argv = yargs.options('p', {
    alias: 'port',
    default: 8080, // default
    demand: false, // option
    type: Number,
    description: 'server port'
}).options('o', {
    alias: 'hostname',
    default: '127.0.0.1',
    demand: false,
    type: String,
    description: 'host'
}).options('d', {
    alias: 'dir',
    default: process.cwd(),
    demand: false,
    type: String,
    description: 'exec directory'
}).usage('usage server-st [options]')
    .alias('h', 'help')
    .alias('v', 'version')
    .example('server-st --port 8080 ')
    .argv

let Server = require('../lib/server-st');
let server = new Server(argv);
server.start();

// judge windows or mac
let os = require('os').platform();
let { exec } = require('child_process');
let url = `http://${argv.hostname}:${argv.port}`

if (argv.open) {
    // auto open browser
    if (os === 'win32') {
        exec(`start ${url}`);
    } else {
        exec(`open ${url}`);
    }
}