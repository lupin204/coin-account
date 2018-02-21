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
var com = require('../app/common.js');

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
    var twoDaysAgo = moment().add(-2, 'days').utcOffset(9).format('YYYYMMDDHHmm00');
    Ticker.remove( {'created': twoDaysAgo} );
    console.log("[removeOldTicker] " + twoDaysAgo);
});


var getTickers = schedule.scheduleJob('1 * * * * *', function(){
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
});

var getTickers2 = schedule.scheduleJob('2 * * * * *', function(){
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
});

var getTickers3 = schedule.scheduleJob('3 * * * * *', function(){
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
});

// 10분에 1번씩 = '*/10 * * * *'
var getTickers4 = schedule.scheduleJob('4 * * * * *', function(){
    var source = 'upbit';

    var reqUrl = 'https://crix-api-endpoint.upbit.com/v1/crix/trends/change_rate';

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (Object.keys(json).length > 0) {
                console.log("[" + source + "] " + Object.keys(json).length + " tickers is selected");
                for(key in json) {
                    var elem = json[key];
                    if (elem.code.split(".")[2].split("-")[0] !== 'ETH') {
                        var tickerCollection = new Ticker();
                        tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm00');
                        tickerCollection.source = source;
                        tickerCollection.market = elem.code.split(".")[2].split("-")[0];    // KRW
                        tickerCollection.coin = elem.code.split(".")[2].split("-")[1];      // TRON
                        tickerCollection.price = elem.tradePrice;
                        tickerCollection.volume = elem.accTradeVolume;
                        //tickerCollection.risefall = elem.change;    // RISE || FALL (빨간불 파란불)

                        tickerCollection.save(function(err, tickerCollection){
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

// 10분에 1번씩 = '*/10 * * * *'
var getPump = schedule.scheduleJob('30 * * * * *', function(){
    var source = 'upbit';
    
    var tasks = [
        function(callback){
            Ticker.find()
            .where('source').equals(source).select('coin market price')
            .then(function(tickers){
                callback(null, tickers);
            })
            .catch(function(err){
                console.error(err);
            });
        },
        function(tickers, callback){
            callback(null, true);
        }
    ];
    async.waterfall(tasks, function(err, result){
        if (err){
            res.status(500).json({error: 'system error'});
        }
    });

});

module.exports = {
    'exchangeJob': exchangeJob,
    'getTickers': getTickers,
    'getTickers2': getTickers2,
    'getTickers3': getTickers3,
    'getTickers4': getTickers4,
    'removeOldTickerJob': removeOldTickerJob
};