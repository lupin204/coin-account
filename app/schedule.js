// modules
const schedule = require("node-schedule");
const moment = require('moment');
const request = require('request');
const cheerio = require('cheerio');
const async = require('async');

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
var jj = schedule.scheduleJob(rule, function(){
     console.log("execute jj");
 });

// exchange rates scheduling : per a hour
var exchangeJob = schedule.scheduleJob('* 1  * * *', function(){
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
                    exchange.created = moment.unix(json.timestamp).format('YYYYMMDDHHmmss');
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

/*
KR bithumb upbit coinone korbit coinrail coinnest
HK binance bitfinex kucoin okex gate-io 
us bittrex kraken poloniex gdax
jp bitflyer
cn huobi
etc liqui
*/
function insertMarket() {
    var source = 'bithumb';
    var reqUrl = 'https://coinmarketcap.com/exchanges/' + source;
    console.log('crawling coinmarketcap');

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var $ = cheerio.load(body);
            var coinCnt = $('#exchange-markets > tbody > tr').length;
            console.log("["+source+"] "+coinCnt);
            var createdDate = moment().format('YYYYMMDD');

            for (var i=1; i<=coinCnt; i++) {
                var elem = $('#exchange-markets > tbody > tr:nth-child('+i+') > td:nth-child(3) > a').text();
                var coin = elem.split('/')[0];
                var market = elem.split('/')[1];

                var marketCollection = new Market();
                marketCollection.source = source;
                marketCollection.coin = coin;
                marketCollection.market = market;
                marketCollection.pair = elem;
                marketCollection.created = createdDate;

                marketCollection.save(function(err, marketCollection){
                    if(err) {
                        console.error(err);
                    }
                });
            }
        }
    });
}


var crawlingCoins = schedule.scheduleJob('* * * * * 1', function(){

    var reqUrl = 'https://coinmarketcap.com/exchanges/bithumb/';
    var createdDate = moment().format('YYYYMMDD');
    var coinmarketcaps = [];

    var tasks = [
        function(callback){
            Market.find()
            .where('source').equals('bithumb').select('pair')
            .then(function(markets) {
                var marketArray = [];
                markets.forEach(function(value, index){
                    marketArray[index] = value.pair;
                });
                callback(null, marketArray);
            })
            .catch(function(err){
                console.error(err);
            });
        },

        function(marketArray, callback){
            request(reqUrl, function(err, res, body){
                if (!err && res.statusCode === 200) {
                    var $ = cheerio.load(body);
                    var coinCnt = $('#exchange-markets > tbody > tr').length;
                    var coinmarketcapArray = [];
                    for (var i=1; i<=coinCnt; i++) {
                        var elem = $('#exchange-markets > tbody > tr:nth-child('+i+') > td:nth-child(3) > a').text();
                        coinmarketcapArray.push(elem);
                    }
                    callback(null, marketArray, coinmarketcapArray);
                }
            });
        },

        function(marketArray, coinmarketcapArray, callback){
            coinmarketcapArray.forEach(function(elem){
                if (marketArray.indexOf(elem) < 0) {
                    console.log(elem + " is needed add");
                    var marketCollection = new Market();
                    marketCollection.source = 'bithumb';
                    marketCollection.coin = elem.split('/')[0];
                    marketCollection.market = elem.split('/')[1];
                    marketCollection.pair = elem;
                    marketCollection.created = moment().format('YYYYMMDD');
    
                    marketCollection.save(function(err, marketCollection){
                        if(err) {
                            console.error(err);
                        }
                    });
                }
            });
            marketArray.forEach(function(elem){
                if (coinmarketcapArray.indexOf(elem) < 0) {
                    console.log(elem + " is needed delete");
                    Market.remove({pair: elem}, function(err, result){
                        if (err) {
                            console.error(err);
                        }
                    });
                }
                
            });
            callback(null, true);
        }
    ];


    async.waterfall(tasks, function (err, result) {
        if (err) {
            console.log(err);
        } else {
           console.log(result);
        }
      });

});

var getTickers = schedule.scheduleJob('1 * * * * *', function(){
    var source = 'upbit';

    var tasks = [
        function(callback){
            Market.find()
            .where('source').equals('upbit').select('coin market')
            .then(function(markets) {
                callback(null, markets);
            })
            .catch(function(err){
                console.error(err);
            });
        },
        function(markets, callback){
            console.log('upbit');

            markets.forEach(element => {
                if (element.market === 'KRW') {
                    stackTicker('upbit', element.market, element.coin);
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
                tickerCollection.created = moment().format('YYYYMMDDHHmm');
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


module.exports = {
    'jj' : jj,
    'exchangeJob': exchangeJob,
    'crawlingCoins': crawlingCoins,
    'getTickers': getTickers
};