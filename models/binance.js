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
const binanceSchema = new Schema({
    symbol: { type: String, required: true},    // BTCUSDT
    priceChange: { type: String, required: false },    // 24시간 기준 price Gap (lastPrice - prevClosePrice)
    priceChangePercent: { type: String, required: true},    // 24시간 기준 price Gap Percent (lastPrice / prevClosePrice )
    weightedAvgPrice: { type: String, required: true },    // ADA, XRP
    prevClosePrice: {type: String, required: false },     // 24hr 전 가격
    lastPrice: {type: String, required: false },                     // 486.1245
    lastQty: {type: String, required: false },           // BID(매수)|ASK(매도)
    bidPrice: {type: String, required: false },           // 매수누적
    bidQty: {type: String, required: false },           // 매도누적
    askPrice: {type: String, required: false },           // 매수매도 합누적
    askQty : {type: String, required: false },      // yyyymmddhh24mi00
    openPrice : {type: String, required: false },      // 1
    highPrice : {type: String, required: false},    // server unixtimestamp
    lowPrice : {type: String, required: false},    // server unixtimestamp
    volume : {type: String, required: false},    // server unixtimestamp
    quoteVolume : {type: String, required: false},    // server unixtimestamp
    openTime : {type: Number, required: false},    // server unixtimestamp
    closeTime : {type: Number, required: false},    // server unixtimestamp
    firstId : {type: Number, required: false},    // server unixtimestamp
    lastId : {type: Number, required: false},    // server unixtimestamp
    count: { type: Number, required: true},   // yyyymmddhh24mi00
    created: {type: String, required: true},
    createdDate: {type: Date, required: true, default: Date.now }
}, {strict: false});

module.exports = mongoose.model('binance', binanceSchema);
