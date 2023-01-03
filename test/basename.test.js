const utils = require('../lib/utils');

const data = utils.beautify(utils.readFileSync('pkg/main/game.js'))

console.log(data);