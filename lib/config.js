const path = require('path');

let config = {
    hostname: 'localhost',
    port: 8080,
    dir: path.join(__dirname, '..', 'public')
}

module.exports = config;