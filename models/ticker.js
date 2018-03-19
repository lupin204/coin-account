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
    bidVolume: {type: String, required: false },           // 매수누적
    askVolume: {type: String, required: false },           // 매도누적
    tradeVolume: {type: String, required: false },           // 매수매도 합누적
    bidAskTime : {type: String, required: false },      // yyyymmddhh24mi00
    volumeRank : {type: String, required: false },      // 1
    created: { type: String, required: true},   // yyyymmddhh24mi00
    createdDate: {type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('ticker', tickerSchema);


/*
upbitObj: {
    marketState: String,
    changeRate: String,
    changePrice: String,
    marketStateForIOS: String,
    accTradeVolume: String,
    tradeStatus: String,
    createdAt: String,
    highPrice: String,
    lowest52WeekPrice: String,
    code: String,
    signedChangeRate: String,
    highest52WeekPrice: String,
    tradeDateKst: String,
    accBidVolume: String,
    tradeVolume: String,
    signedChangePrice: String,
    accTradePrice24h: String,
    timestamp: String,
    delistingDate: String,
    prevClosingPrice: String,
    tradeTime: String,
    openingPrice: String,
    accTradeVolume24h: String,
    tradePrice: String,
    tradeTimestamp: String,
    isTradingSuspended: String,
    change: String,
    askBid: String,
    lowest52WeekDate: String,
    tradeTimeKst: String,
    accTradePrice: String,
    tradeDate: String,
    lowPrice: String,
    modifiedAt: String,
    accAskVolume: String,
    highest52WeekDate: String,
    rank: String
}*/