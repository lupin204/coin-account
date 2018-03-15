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
    pair: { type: String, required: false },    // BTC-KRW
    market: { type: String, required: true},    // KRW, BTC
    coin: { type: String, required: true },    // ADA, XRP
    price: {type: String, required: false },     // 10000
    volume: {type: String, required: false },                     // 486.1245
    bidAsk: {type: String, required: false },           // BID(매수)|ASK(매도)
    bidAskTime : {type: String, required: false },      // yyyymmddhh24mi00
    volumeRank : {type: String, required: false },      // 1
    created: { type: String, required: true},   // yyyymmddhh24mi00
    createdDate: {type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('ticker', tickerSchema);