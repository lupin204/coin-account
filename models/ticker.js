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
const tickerSchema = new Schema({
    
    /*created: { type: String, required: true, unique: true, index: true},*/
    source: { type: String, required: true},    // upbit
    market: { type: String, required: true},    // KRW, BTC
    coin: { type: String, required: true },    // ADA, XRP
    price: {type: Number, required: true },     // 10000
    volume: {type: Number, required: false },                     // 486.1245
    created: { type: String, required: true},   // yyyymmddhh24mi
    createdDate: {type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('ticker', tickerSchema);