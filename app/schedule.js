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
var jj = schedule.scheduleJob('* /10 * * * *', function(){
    console.log("check idle");
    var url = "https://obscure-gorge-24159.herokuapp.com/api2/test3";
    http.get(url, function(res){
        console.log("http request done");
    });
 });

// exchange rates scheduling : per a hour
var exchangeJob = schedule.scheduleJob('* 1 * * * *', function(){
    console.log('schedule111');
    var currencies = 'KRW,JPY'
    //var reqUrl = 'https://openexchangerates.org/api/latest.json?&app_id=' + constants.apiKey.openexchangerates + '&symbols=' + currencies;
    var reqUrl = 'https://openexchangerates.org/api/latest.json?&app_id=' + 'f59fad45f8c84e0394b990f6815c41b8' + '&symbols=' + currencies;

    request(reqUrl, function(err, res, body){
        
        if (!err && res.statusCode === 200) {
            console.log(body);
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


var getTickers = schedule.scheduleJob('1 * * * * *', function(){
    var source = 'bithumb';

    var reqUrl = 'https://api.bithumb.com/public/ticker/all';

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (json.status === '0000' && Object.keys(json.data).length > 0) {
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

function stackTicker(source, market, coin) {
    var reqUrl = 'https://crix-api-endpoint.upbit.com/v1/crix/candles/days?code=CRIX.UPBIT.' + market + '-' + coin;

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (json.length > 0) {
                var tradePrice = json[0].tradePrice;
                if (market === 'BTC') {
                    tradePrice = com.toSatoshiFormat(tradePrice);
                }
                console.log("["+market+"_"+coin+"] "+tradePrice);
                var tickerCollection = new Ticker();
                tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm');
                tickerCollection.source = source;
                tickerCollection.market = market;
                tickerCollection.coin = coin;
                tickerCollection.price = tradePrice;

                tickerCollection.save(function(err, tickerCollection){
                    if(err) {
                        console.error(err);
                    }
                });               

            } else {
                console.log("no such coin.");
            }
        }
    });
}

/*
var getTickers = schedule.scheduleJob('* * * * * *', function(){
    var source = 'bithumb';

    var tasks = [
        function(callback){
            Market.find()
            .where('source').equals(source).select('coin market')
            .then(function(markets) {
                callback(null, markets);
            })
            .catch(function(err){
                console.error(err);
            });
        },
        function(markets, callback){
            console.log(source);

            markets.forEach(element => {
                if (element.market === 'KRW') {
                    stackTicker(source, element.market, element.coin);
                }
            });
        }
    ];

    async.waterfall(tasks, function(err, result){
        if(err) console.error(err);
    });
});

function stackTicker(source, market, coin) {
    var reqUrl = 'https://crix-api-endpoint.upbit.com/v1/crix/candles/days?code=CRIX.UPBIT.' + market + '-' + coin;

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (json.length > 0) {
                var tradePrice = json[0].tradePrice;
                if (market === 'BTC') {
                    tradePrice = com.toSatoshiFormat(tradePrice);
                }
                console.log("["+market+"_"+coin+"] "+tradePrice);
                var tickerCollection = new Ticker();
                tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm');
                tickerCollection.source = source;
                tickerCollection.market = market;
                tickerCollection.coin = coin;
                tickerCollection.price = tradePrice;

                tickerCollection.save(function(err, tickerCollection){
                    if(err) {
                        console.error(err);
                    }
                });               

            } else {
                console.log("no such coin.");
            }
        }
    });
}
*/


module.exports = {
    'jj' : jj
};