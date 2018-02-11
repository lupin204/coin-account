var express = require('express');
var request = require('request');
var router = express.Router();

// temp
const cheerio = require('cheerio');
const Market = require('../models/market');
const async = require('async');
// temp end


var com = require('../app/common.js');

const Exchange = require('../models/exchange');
const Market = require('../models/market');
const moment = require('moment');

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
                    if(err) return res.status(500).json({ error: "database failure" });
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
                return res.status(500).json({error: 'system error'});
            }
        });
    }
});

function insertMarket(source) {
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

module.exports = router;

