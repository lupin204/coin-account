var express = require('express');
var request = require('request');
var router = express.Router();

const cheerio = require('cheerio');
const async = require('async');
const moment = require('moment');

const Exchange = require('../models/exchange');
const Market = require('../models/market');
const Ticker = require('../models/ticker');
const com = require('../app/common.js');


/*
KR bithumb upbit coinone korbit coinrail coinnest
HK binance bitfinex kucoin okex gate-io 
us bittrex kraken poloniex gdax
jp bitflyer
cn huobi
etc liqui
*/
router.put(['/updateMarket/:source'], function(req, res, next) {
    
    var source = req.params.source;
    if (!source) {
        res.status(200).send('Need to source (upbit, binance, etc...)');
    } else {
        var tasks = [
            function(callback){
                Market.remove({ source: source }, function(err, output){
                    if(err) res.status(500).json({ error: "database failure" });
                    console.log("[" + source + "] " + output.n + " items is removed");
                    callback(null, source);
                });
            },
            function(source, callback){
                insertMarket(source);
                callback(null, true);
            }
        ];
        async.waterfall(tasks, function(err, result){
            if (err){
                res.status(500).json({error: 'system error'});
            }
        });
    }
    res.send("respond with a resource");
});

function insertMarket(source) {
    var reqUrl = 'https://coinmarketcap.com/exchanges/' + source;
    console.log('crawling coinmarketcap');

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var $ = cheerio.load(body);
            var coinCnt = $('#exchange-markets > tbody > tr').length;
            console.log("["+source+"] "+ coinCnt + " items is selected from Coinmarketcap");
            var createdDate = moment().utcOffset(9).format('YYYYMMDD');
            var sourceTxt = source.replace('-','');

            for (var i=1; i<=coinCnt; i++) {
                var pairElem = $('#exchange-markets > tbody > tr:nth-child('+i+') > td:nth-child(3) > a').text();
                var coin = pairElem.split('/')[0];
                var market = pairElem.split('/')[1];
                var fullnameElem = $('#exchange-markets > tbody > tr:nth-child('+i+') > td:nth-child(2) > a').text();

                var marketCollection = new Market();
                marketCollection.source = sourceTxt;
                marketCollection.fullname = fullnameElem;
                marketCollection.coin = coin;
                marketCollection.market = market;
                marketCollection.pair = pairElem;
                marketCollection.created = createdDate;

                marketCollection.save(function(err, marketCollection){
                    if(err) console.error(err);
                });
            }
        }
    });
}

function selectMarket(source) {
    Market.find()
    .where('source').equals(source).select('coin market')
    .then(function(markets) {
        console.log("[" + source + "] " + markets.length + " items is saved");
    })
    .catch(function(err){
        console.error(err);
    });
}

function crawlingCoins() {

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
};

router.post(['/setTickers/:source'], function(req, res, next) {
    var source = req.params.source;
    if (!source) {
        res.status(200).send('Need to source (upbit, binance, etc...)');
    } else {
        var tasks = [
            function(callback){
                Market.remove({ source: source }, function(err, output){
                    if(err) res.status(500).json({ error: "database failure" });
                    console.log("[" + source + "] " + output.n + " items is removed");
                    callback(null, source);
                });
            },
            function(source, callback){
                insertMarket(source);
                callback(null, true);
            }
        ];
    }
});

module.exports = router;

