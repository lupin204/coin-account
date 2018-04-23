const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/* Schema Type  http://mongoosejs.com/docs/schematypes.html
String
Number
Date
Buffer
Boolean
Mixed
Objectid
Array
*/
const BalanceSchema = new Schema({
    source: { type: String, required: false},
    name: { type: String, required: false },
    market: { type: String, required: false},
    coin: { type: String, required: false },
    pair: {type: String, required: false },
    volume: {type: String, required: false },
    created: {type: String, required: false },
    modified: {type: String, required: false },
    price: {type: String, required: false},
    estimate: {type: String, required: false },
    satoshi: {type: String, required: false }
}, {strict: false});

module.exports = mongoose.model('balance', BalanceSchema);
