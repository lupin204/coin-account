// modules
const schedule = require("node-schedule");
const moment = require('moment');
const request = require('request');
const cheerio = require('cheerio');
const async = require('async');
const http = require("http");

// models
const Exchange = require('../models/exchange');
const Market = require('../models/market');
const Ticker = require('../models/ticker');

// user-defined
const constants = require('../app/constants');
const com = require('../app/common.js');
const bot = require('../app/telegrambot');

var rule = new schedule.RecurrenceRule();
rule.second = 50;



/*
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
--> scheduleJob('* * * * * *', function(){
*/
// exchange rates scheduling : 매 시 1분 30초
//var exchangeJob = schedule.scheduleJob('* * * 1 1 *', function(){
var exchangeJob = schedule.scheduleJob('30 1 * * * *', function(){
    var currencies = 'KRW,JPY'
    //var reqUrl = 'https://openexchangerates.org/api/latest.json?&app_id=' + constants.apiKey.openexchangerates + '&symbols=' + currencies;
    var reqUrl = 'https://openexchangerates.org/api/latest.json?&app_id=' + 'f59fad45f8c84e0394b990f6815c41b8' + '&symbols=' + currencies;

    request(reqUrl, function(err, res, body){
        
        if (!err && res.statusCode === 200) {
            console.log("[currency] " + body);
            var json = JSON.parse(body);
            if (!json.error) {
                var krw = json.rates['KRW'];
                json.rates["USD"] = json.rates["KRW"];
                delete json.rates['KRW'];

                for(key in json.rates) {
                    var exchange = new Exchange();
                    exchange.created = moment.unix(json.timestamp).utcOffset(9).format('YYYYMMDDHHmmss');
                    exchange.base = 'KRW';  // KRW
                    exchange.currency = key;    // KRW | JPY
                    exchange.rates = (key === 'USD') ? krw : krw / json.rates[key];

                    if (com.isApp) {
                        exchange.save(function(err, exchange){
                            if(err) {
                                console.error(err);
                            }
                        });
                    }
                }
            }
        }
    });
});

// 최근 2일간의 Ticker정보만 저장 scheduling : 매일 0시 0분 30초
var removeOldTickerJob = schedule.scheduleJob('30 0 0 * * *', function(){
    var twoDaysAgo = moment().add(-2, 'days').utcOffset(9).format('YYYYMMDD');
    var regExp = '^'+twoDaysAgo;
    Ticker.remove( {'created': new RegExp(regExp)}, function(err, res) {
        if (err) console.log(err);
        console.log("[removeOldTicker] " + twoDaysAgo + " : " + res.n + " ticker is removed.");
    });
});

// 10분에 1번씩 = '*/10 * * * *'
var getTickersBinance = schedule.scheduleJob('* * * 1 1 *', function(){
//var getTickersBinance = schedule.scheduleJob('1 * * * * *', function(){
    var source = 'binance';

    var reqUrl = 'https://api.binance.com/api/v1/ticker/24hr';
    //var tickersUpbit = com.tickersUpbit;

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (Object.keys(json).length > 0) {
                console.log("[" + moment().utcOffset(9).format('YYYY-MM-DD HH:mm') + "] " + Object.keys(json).length + " " + source + " tickers is selected");
                for(key in json) {
                    var elem = json[key];
                    // BTC KRW 갯수 = 157
                    if (elem.code.split(".")[2].split("-")[0] === 'KRW' || elem.code.split(".")[2].split("-")[0] === 'BTC') {
                        var tickerCollection = new Ticker();
                        //tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmmss').replace(datePattern,'0');
                        tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm00');
                        tickerCollection.source = source;
                        var elem_market = elem.code.split(".")[2].split("-")[0];    // CRIX.UPBIT.KRW-ADA
                        var elem_coin = elem.code.split(".")[2].split("-")[1];
                        tickerCollection.pair = elem_coin + "-" + elem_market;
                        tickerCollection.market = elem_market;    // KRW
                        tickerCollection.coin = elem_coin;      // ADA
                        tickerCollection.price = elem.tradePrice;
                        tickerCollection.volume = elem.tradeVolume;
                        tickerCollection.bidVolume = elem.accBidVolume;
                        tickerCollection.askVolume = elem.accAskVolume;
                        tickerCollection.bidAsk = elem.askBid;
                        tickerCollection.bidAskTime = elem.tradeDate + elem.tradeTimeKst;
                        tickerCollection.volumeRank = elem.rank;
                        //tickerCollection.risefall = elem.change;    // RISE || FALL (빨간불 파란불)
                        //tickerCollection.upbitObj = elem;

                        if (com.isApp) {
                            tickerCollection.save(function(err, tickerCollection){
                                if(err) {
                                    console.error(err);
                                }
                            });
                        }

                        var pair = elem_coin+"-"+elem_market;
                        var nowTickerOfPair = {};
                        nowTickerOfPair.created = tickerCollection.created;
                        nowTickerOfPair.pair = tickerCollection.pair;
                        nowTickerOfPair.market = tickerCollection.market;
                        nowTickerOfPair.coin = tickerCollection.coin;
                        nowTickerOfPair.price = tickerCollection.price;
                        nowTickerOfPair.volumeRank = tickerCollection.volumeRank;
                        nowTickerOfPair.askVolume = tickerCollection.askVolume;
                        nowTickerOfPair.bidVolume = tickerCollection.bidVolume;

                        if (pair == 'BTC-KRW') {
                            com.tickerUpbitBtc = tickerCollection.price;
                        }

                        if (tickersUpbit[pair]) {
                            // normal case - saved 2 ticks
                            if (tickersUpbit[pair].length > 1) {
                                tickersUpbit[pair].shift();
                                tickersUpbit[pair].push(nowTickerOfPair);
                            // saved 1 tick
                            } else {
                                tickersUpbit[pair].push(nowTickerOfPair);
                            }
                        // saved no tick
                        } else {
                            tickersUpbit[pair] = [];
                            tickersUpbit[pair].push(nowTickerOfPair);
                        }

                        

                    }
                } // end of loop
            } 
        }
        com.tickersUpbit = tickersUpbit;
    }); // end of request


    setTimeout(() => {
        //console.log('[upbit] timeout 100ms - ' + moment().utcOffset(9).format('YYYYMMDDHHmmss'));
    }, 100);
});

// 10분에 1번씩 = '*/10 * * * *'
//var getTickersUpbit = schedule.scheduleJob('* * * 1 1 *', function(){
    var getTickersUpbit = schedule.scheduleJob('3 * * * * *', function(){
        var source = 'upbit';
    
        var reqUrl = 'https://crix-api-endpoint.upbit.com/v1/crix/trends/change_rate';
        var datePattern = /.$/;
        var tickersUpbit = com.tickersUpbit;
    
        request(reqUrl, function(err, res, body){
            if (!err && res.statusCode === 200) {
                var json = JSON.parse(body);
                if (Object.keys(json).length > 0) {
                    console.log("[" + moment().utcOffset(9).format('YYYY-MM-DD HH:mm') + "] " + Object.keys(json).length + " " + source + " tickers is selected");
                    for(key in json) {
                        var elem = json[key];
                        // BTC KRW 갯수 = 157
                        if (elem.code.split(".")[2].split("-")[0] === 'KRW' || elem.code.split(".")[2].split("-")[0] === 'BTC') {
                            var tickerCollection = new Ticker();
                            //tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmmss').replace(datePattern,'0');
                            tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm00');
                            tickerCollection.source = source;
                            var elem_market = elem.code.split(".")[2].split("-")[0];    // CRIX.UPBIT.KRW-ADA
                            var elem_coin = elem.code.split(".")[2].split("-")[1];
                            tickerCollection.pair = elem_coin + "-" + elem_market;
                            tickerCollection.market = elem_market;    // KRW
                            tickerCollection.coin = elem_coin;      // ADA
                            tickerCollection.price = elem.tradePrice;
                            tickerCollection.volume = elem.tradeVolume;
                            tickerCollection.bidVolume = elem.accBidVolume;
                            tickerCollection.askVolume = elem.accAskVolume;
                            tickerCollection.bidAsk = elem.askBid;
                            tickerCollection.bidAskTime = elem.tradeDate + elem.tradeTimeKst;
                            tickerCollection.volumeRank = elem.rank;
                            //tickerCollection.risefall = elem.change;    // RISE || FALL (빨간불 파란불)
                            //tickerCollection.upbitObj = elem;
    
                            if (com.isApp) {
                                tickerCollection.save(function(err, tickerCollection){
                                    if(err) {
                                        console.error(err);
                                    }
                                });
                            }
    
                            var pair = elem_coin+"-"+elem_market;
                            var nowTickerOfPair = {};
                            nowTickerOfPair.created = tickerCollection.created;
                            nowTickerOfPair.pair = tickerCollection.pair;
                            nowTickerOfPair.market = tickerCollection.market;
                            nowTickerOfPair.coin = tickerCollection.coin;
                            nowTickerOfPair.price = tickerCollection.price;
                            nowTickerOfPair.volumeRank = tickerCollection.volumeRank;
                            nowTickerOfPair.askVolume = tickerCollection.askVolume;
                            nowTickerOfPair.bidVolume = tickerCollection.bidVolume;
    
                            if (pair == 'BTC-KRW') {
                                com.tickerUpbitBtc = tickerCollection.price;
                            }
    
                            if (tickersUpbit[pair]) {
                                // normal case - saved 2 ticks
                                if (tickersUpbit[pair].length > 1) {
                                    tickersUpbit[pair].shift();
                                    tickersUpbit[pair].push(nowTickerOfPair);
                                // saved 1 tick
                                } else {
                                    tickersUpbit[pair].push(nowTickerOfPair);
                                }
                            // saved no tick
                            } else {
                                tickersUpbit[pair] = [];
                                tickersUpbit[pair].push(nowTickerOfPair);
                            }
    
                            
    
                        }
                    } // end of loop
                } 
            }
            com.tickersUpbit = tickersUpbit;
        }); // end of request
    
    
        setTimeout(() => {
            //console.log('[upbit] timeout 100ms - ' + moment().utcOffset(9).format('YYYYMMDDHHmmss'));
        }, 100);
    });

//var getPumpUpbit = schedule.scheduleJob('* * * 1 1 *', function(){
var getPumpUpbit = schedule.scheduleJob('5 * * * * *', function(){
    var source = 'upbit';

    var tickers = com.tickersUpbit;
    //console.log(Object.keys(tickers).length + " - " + tickers[Object.keys(tickers)[0]].length);
    // 2틱이상 메모리(com.tickersUpbit)에 저장된 이후 펌핑 체크
    if (Object.keys(tickers).length > 0 && tickers[Object.keys(tickers)[0]].length > 1) {
        var tickers = com.tempFunc2(com.tickersUpbit);
                
        var sendTelegram = false;
        var rtnMsg = "[Pump] " + moment().utcOffset(9).format('MM-DD HH:mm') + "\n";

        var tickersLength = tickers.length;
        for (var i=0; i<tickersLength; i++) {

            // #1.최종순위 5위 이내
            // 가격상승 0.8%이상
            // 순위상승 해당없음
            // 매수량 매도량 모두 존재하는 경우
            // 매수량이 매도량보다 큰 경우
            // 순매수(매수-매도)금액이 50M krw 이상
            if (tickers[i].volumeRank < 5
                && tickers[i].priceGap > 0.8
                //&& tickers[i].volumeRankGap > 2
                && tickers[i].bidVolumeGap > 1 && tickers[i].askVolumeGap > 1
                && tickers[i].bidVolumeGap > tickers[i].askVolumeGap && tickers[i].bidVolumeGap / tickers[i].askVolumeGap > 2
                && tickers[i].volumeGapPrice > 50000000) {
                    rtnMsg += "1 [" + tickers[i].pair + "] : " + tickers[i].price + " - " + tickers[i].fromVolumeRank + "->" + tickers[i].volumeRank + "("+ (tickers[i].volumeGapPrice/10000000).toFixed(1) + "vol) : " + tickers[i].priceGap + "%  ( " + tickers[i].priceGapNum + " UP)\n";
                sendTelegram = true;


            // #2.최종순위 30위 이내
            // 가격상승 1%이상
            // 순위상승 이전순위에 비해 10위 이상
            // 매수량 매도량 모두 존재하는 경우
            // 매수량이 매도량보다 2배 이상 큰 경우
            // 순매수(매수-매도)금액이 50M krw 이상
            } else if (tickers[i].volumeRank < 30
                && tickers[i].priceGap > 1
                && tickers[i].volumeRankGap > 10
                && tickers[i].bidVolumeGap > 1 && tickers[i].askVolumeGap > 1
                && tickers[i].bidVolumeGap > tickers[i].askVolumeGap && tickers[i].bidVolumeGap / tickers[i].askVolumeGap > 2
                && tickers[i].volumeGapPrice > 50000000) {
                rtnMsg += "2 [" + tickers[i].pair + "] : " + Number(tickers[i].price) + " - " + tickers[i].fromVolumeRank + "->" + tickers[i].volumeRank + "("+ (tickers[i].volumeGapPrice/10000000).toFixed(1) + "vol) : " + tickers[i].priceGap + "%  ( " + tickers[i].priceGapNum + " UP)\n";
                sendTelegram = true;

            // #3.최종순위 150위 이내
            // 가격상승 0.8% 이상
            // 순위상승 80위 이상
            // 매수량 매도량 모두 존재하는 경우
            // 매수량이 매도량보다 큰 경우
            // 순매수(매수-매도)금액이 50M krw 이상
            } else if (tickers[i].volumeRank < 150
                && tickers[i].priceGap > 0.8
                && tickers[i].volumeRankGap > 80
                && tickers[i].bidVolumeGap > 1 && tickers[i].askVolumeGap > 1
                && tickers[i].bidVolumeGap > tickers[i].askVolumeGap && tickers[i].bidVolumeGap / tickers[i].askVolumeGap > 2
                && tickers[i].volumeGapPrice > 5000000) {
                rtnMsg += "3 [" + tickers[i].pair + "] : " + tickers[i].price + " - " + tickers[i].fromVolumeRank + "->" + tickers[i].volumeRank + "("+ (tickers[i].volumeGapPrice/10000000).toFixed(1) + "vol) : " + tickers[i].priceGap + "%  ( " + tickers[i].priceGapNum + " UP)\n";
                sendTelegram = true;
            }
        }

        if (sendTelegram) {
            bot.telegrambot.sendMessage(bot.channedId, rtnMsg);
            console.log(rtnMsg);
        } else {
            //console.log(rtnMsg + " : no pump");
        }
    }

});

