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

                    exchange.save(function(err, exchange){
                        if(err) {
                            console.error(err);
                        }
                    });

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


var getTickers = schedule.scheduleJob('* * * 1 1 *', function(){
//var getTickers = schedule.scheduleJob('1 * * * * *', function(){
    var source = 'bithumb';

    var reqUrl = 'https://api.bithumb.com/public/ticker/all';

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (json.status === '0000' && Object.keys(json.data).length > 0) {
                delete json.data['date'];
                console.log("[" + source + "] " + Object.keys(json.data).length + " tickers is selected");
                for(key in json.data) {
                    var elem = json.data[key];
                    var tickerCollection = new Ticker();
                    tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm00');
                    tickerCollection.source = source;
                    tickerCollection.market = 'KRW';
                    tickerCollection.coin = key;
                    tickerCollection.price = json.data[key].closing_price;
                    tickerCollection.volume = json.data[key].units_traded;

                    tickerCollection.save(function(err, tickerCollection){
                        if(err) {
                            console.error(err);
                        }
                    });

                }
            } 
        }
    });
    setTimeout(() => {
        console.log('[bithumb] timeout 100ms - ' + moment().utcOffset(9).format('YYYYMMDDHHmm00'));
    }, 100);
});

var getTickers2 = schedule.scheduleJob('* * * 1 1 *', function(){
//var getTickers2 = schedule.scheduleJob('2 * * * * *', function(){
    var source = 'coinnest';

    var reqUrl = 'https://api.coinnest.co.kr/api/pub/tickerall';

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (Object.keys(json).length > 0) {
                console.log("[" + source + "] " + Object.keys(json).length + " tickers is selected");
                for(key in json) {
                    var elem = json[key];
                    var tickerCollection = new Ticker();
                    tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm00');
                    tickerCollection.source = source;
                    tickerCollection.market = key.split("_")[0];    // KRW
                    tickerCollection.coin = key.split("_")[1];      // TRON
                    tickerCollection.price = json[key].last;
                    tickerCollection.volume = json[key].vol;

                    tickerCollection.save(function(err, tickerCollection){
                        if(err) {
                            console.error(err);
                        }
                    });
                }
            } 
        }
    });
    setTimeout(() => {
        console.log('[coinnest] timeout 100ms - ' + moment().utcOffset(9).format('YYYYMMDDHHmm00'));
    }, 100);
});

var getTickers3 = schedule.scheduleJob('* * * 1 1 *', function(){
//var getTickers3 = schedule.scheduleJob('3 * * * * *', function(){
    var source = 'coinrail';
    
    Market.find()
    .where('source').equals(source).select('coin market')
    .then(function(markets) {
        console.log("[" + source + "] " + markets.length + " items is selected");
        
        markets.forEach(function(market){
            var reqUrl = 'https://api.coinrail.co.kr/public/last/order?currency=' + market.coin + "-" + market.market;

            request(reqUrl, function(err, res, body){
                if (!err && res.statusCode === 200) {
                    var json = JSON.parse(body);
                    if (json.error_code === 0) {
                        var tickerCollection = new Ticker();
                        tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm00');
                        tickerCollection.source = source;
                        tickerCollection.market = market.market;    // KRW
                        tickerCollection.coin = market.coin;      // TRON
                        tickerCollection.price = json.last_price;
                        tickerCollection.volume = 0;
    
                        tickerCollection.save(function(err, tickerCollection){
                            if(err) {
                                console.error(err);
                            }
                        });
                    } 
                }
            });

        });
    })
    .catch(function(err){
        console.error(err);
    });
    setTimeout(() => {
        console.log('[coinrail] timeout 100ms - ' + moment().utcOffset(9).format('YYYYMMDDHHmm00'));
    }, 100);
});

// 10분에 1번씩 = '*/10 * * * *'
//var getTickers4 = schedule.scheduleJob('* * * 1 1 *', function(){
var getTickers4 = schedule.scheduleJob('3 * * * * *', function(){
    var source = 'upbit';

    var reqUrl = 'https://crix-api-endpoint.upbit.com/v1/crix/trends/change_rate';
    var datePattern = /.$/;
    var tickersUpbit = com.tickersUpbit;

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (Object.keys(json).length > 0) {
                console.log("[" + moment().utcOffset(9).format('YYYYMMDDHHmmss') + "] " + Object.keys(json).length + " " + source + " tickers is selected");
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

                        tickerCollection.save(function(err, tickerCollection){
                            if(err) {
                                console.error(err);
                            }
                        });

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

// 1분에 1번씩 = '*/10 * * * *'
// 최근 3분봉
var getPump = schedule.scheduleJob('* * * 1 1 *', function(){
//var getPump = schedule.scheduleJob('10 * * * * *', function(){
    var source = 'upbit';
    var pumpGap = 3;    // 3분변화량 (4틱)
    
    var tasks = [
        function(callback){
            var fiveMinutesAgo = moment().add(-1-pumpGap,'minute').utcOffset(9).format('YYYYMMDDHHmm00');
            Ticker.find()
            .where('source').equals(source)
            .where('created').gt(fiveMinutesAgo)
            //.where('pair').equals('SNT-BTC')
            .where('market').in(['KRW','BTC'])
            .sort({'coin':1, 'market':1, 'created':1}).select('created pair market coin price volume bidVolume askVolume bidAskTime volumeRank')
            .then(function(tickers){
                callback(null, tickers);
            })
            .catch(function(err){
                console.error(err);
            });
        },
        function(tickers, callback){
            tickers = com.groupByArray(tickers, 'pair');
            var i=0, tickerLength = Object.keys(tickers).length;
            var chkPump = {
                price: 0,
                bidVolume: 0,
                askVolume: 0,
                bidAskTime: 0,
                volumeRank: 0
            };
            var isPumping = 0;
            var sendTelegram = false;
            var rtnMsg = "[PUMP - " + pumpGap + "min ] " + moment().utcOffset(9).format('YYYY-MM-DD HH:mm');

            for (key in tickers) {
                //console.log(tickers[key]);

                for (var j=0; j<pumpGap; j++) {
                    // 가격 펌핑 - 0.1%
                    if ((Number(tickers[key][j+1].price) / Number(tickers[key][j].price)) > 1) {
                        // 거래량 체크 - ticker(1분)마다 계속 거래가 있었는지
                        if (moment(tickers[key][j].created, 'YYYYMMDDHHmm00').minutes() === moment(tickers[key][j].bidAskTime, 'YYYYMMDDHHmm00').add(1, 'minutes').minutes()) {
                            // 매수세 > 매도세 인지
                            if (Number(tickers[key][j+1].bidVolume) - Number(tickers[key][j].bidVolume) > Number(tickers[key][j+1].askVolume) - Number(tickers[key][j].askVolume)) {
                                // 거래량 상위 150등 이내인지 (총244코인)
                                if (Number(tickers[key][j+1].volumeRank) < 150) {
                                    //var debugTxt = key + " : " + Number(tickers[key][j].price) + " ==> " + Number(tickers[key][j+1].price) + " ~~ "+ (Number(tickers[key][j+1].bidVolume) - Number(tickers[key][j].bidVolume)) + " : " + (Number(tickers[key][j+1].askVolume) - Number(tickers[key][j].askVolume));
                                    //console.log(debugTxt);
                                    isPumping++;
                                }
                            }
                        }
                    } else {
                        isPumping = 0;
                    }
                }

                // 연속 상승
                if (isPumping >= pumpGap) {
                    var tickerFirst = tickers[key][0];
                    var tickerLast = tickers[key][pumpGap];
                    rtnMsg += "\n[" + key + "] : " + ((Number(tickerLast.price) / Number(tickerFirst.price) - 1) * 100).toFixed(2) + "% ( " + tickerLast.volumeRank + " )"
                            + "\n(" + com.toSatoshiFormat(tickerFirst.price, tickerFirst.market) + " ==> " + com.toSatoshiFormat(tickerLast.price,tickerLast.market) + ")";
                    //var debugTxt = "[" + key + "] : " + "" + Number(tickers[key][0].price) + " ==> " + Number(tickers[key][pumpGap].price + "( " + tickers[key][pumpGap].rank + " )");
                    //console.log(debugTxt);
                    sendTelegram = true;
                }
                isPumping = 0;
            }
            callback(null, tickers, rtnMsg, sendTelegram);
        }
    ];
    async.waterfall(tasks, function(err, result, rtnMsg, sendTelegram){
        if (err){
            res.status(500).json({error: 'system error'});
        }
        console.log(rtnMsg);
        if (sendTelegram) bot.telegrambot.sendMessage(bot.channedId, rtnMsg);
    });
});

//var getPumpUpbit = schedule.scheduleJob('* * * 1 1 *', function(){
var getPumpUpbit = schedule.scheduleJob('10 * * * * *', function(){
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
            // 순매수(매수-매도)금액이 100M krw 이상
            if (tickers[i].volumeRank < 5
                && tickers[i].priceGap > 0.8
                //&& tickers[i].volumeRankGap > 2
                && tickers[i].bidVolumeGap > 1 && tickers[i].askVolumeGap > 1
                && tickers[i].bidVolumeGap > tickers[i].askVolumeGap
                && tickers[i].volumeGapPrice > 100000000) {
                    rtnMsg += "1 [" + tickers[i].pair + "] : " + tickers[i].price + " - " + tickers[i].fromVolumeRank + "->" + tickers[i].volumeRank + "("+ (tickers[i].volumeGapPrice/10000000).toFixed(1) + "vol) : " + tickers[i].priceGap + "%  ( " + tickers[i].priceGapNum + " UP)\n";
                sendTelegram = true;


            // #2.최종순위 20위 이내
            // 가격상승 1%이상
            // 순위상승 이전순위에 비해 2위 이상 (이전순위 3위 이하는 체크되지 않음)
            // 매수량 매도량 모두 존재하는 경우
            // 매수량이 매도량보다 큰 경우
            // 순매수(매수-매도)금액이 100M krw 이상
            } else if (tickers[i].volumeRank < 20
                && tickers[i].priceGap > 1
                && tickers[i].volumeRankGap > 10
                && tickers[i].bidVolumeGap > 1 && tickers[i].askVolumeGap > 1
                && tickers[i].bidVolumeGap > tickers[i].askVolumeGap
                && tickers[i].volumeGapPrice > 100000000) {
                rtnMsg += "2 [" + tickers[i].pair + "] : " + Number(tickers[i].price) + " - " + tickers[i].fromVolumeRank + "->" + tickers[i].volumeRank + "("+ (tickers[i].volumeGapPrice/10000000).toFixed(1) + "vol) : " + tickers[i].priceGap + "%  ( " + tickers[i].priceGapNum + " UP)\n";
                sendTelegram = true;

            // #3.최종순위 150위 이내
            // 가격상승 0.8% 이상
            // 순위상승 80위 이상
            // 매수량 매도량 모두 존재하는 경우
            // 매수량이 매도량보다 큰 경우
            // 순매수(매수-매도)금액이 10M krw 이상
            } else if (tickers[i].volumeRank < 150
                && tickers[i].priceGap > 0.8
                && tickers[i].volumeRankGap > 80
                && tickers[i].bidVolumeGap > 1 && tickers[i].askVolumeGap > 1
                && tickers[i].bidVolumeGap > tickers[i].askVolumeGap
                && tickers[i].volumeGapPrice > 10000000) {
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

module.exports = {
    'exchangeJob': exchangeJob,
    'getTickers': getTickers,
    'getTickers2': getTickers2,
    'getTickers3': getTickers3,
    'getTickers4': getTickers4,
    'removeOldTickerJob': removeOldTickerJob
};