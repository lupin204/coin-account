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
const bot = require('../app/telegrambot');


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

router.get(['/pump'], function(req, res, next) {
    var source = 'upbit';
    
    var tasks = [
        function(callback){
            var fiveMinutesAgo = moment().add(-4,'minute').utcOffset(9).format('YYYYMMDDHHmm00');
            Ticker.find()
            .where('source').equals(source)
            .where('created').gt(fiveMinutesAgo)
            //.where('pair').equals('SNT-BTC')
            .where('market').equals('KRW')
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
            var rtnMsg = "[Pump - 3 minutes] " + moment().utcOffset(9).format('MM-DD HH:mm') + "<br>";

            for (key in tickers) {
                //console.log(tickers[key]);
                

                // 일단 3분봉 가져옴
                for (var j=0; j<3; j++) {
                    // 가격 펌핑 - 0.1%
                    if ((Number(tickers[key][j+1].price) / Number(tickers[key][j].price)) > 1.001) {
                        // 거래량 체크 - ticker(1분)마다 계속 거래가 있었는지
                        if (moment(tickers[key][j].created, 'YYYYMMDDHHmm00').minutes() === moment(tickers[key][j].bidAskTime, 'YYYYMMDDHHmm00').add(1, 'minutes').minutes()) {
                            // 매수세 > 매도세 인지
                            if (Number(tickers[key][j+1].bidVolume) - Number(tickers[key][j].bidVolume) > Number(tickers[key][j+1].askVolume) - Number(tickers[key][j].askVolume)) {
                                console.log(key + " : " + Number(tickers[key][j].price) + " ==> " + Number(tickers[key][j+1].price) + " ~~ " + 
                                (Number(tickers[key][j+1].bidVolume) - Number(tickers[key][j].bidVolume)) + " : " + (Number(tickers[key][j+1].askVolume) - Number(tickers[key][j].askVolume)));
                                isPumping++;
                            }
                        }
                    } else {
                        isPumping = 0;
                    }
                    // var bidVolumeGap = Number(tickers[key][j+1].bidVolume) - Number(tickers[key][j].bidVolume);
                    // var askVolumeGap = Number(tickers[key][j+1].askVolume) - Number(tickers[key][j].askVolume);
                }

                // 3틱 연속 상승
                if (isPumping === 3) {
                    rtnMsg += "[" + key + "] : " + tickers[key][0].price + " ==> " + tickers[key][3].price + "<br>";
                    console.log("[" + key + "] : " + "" + Number(tickers[key][0].price) + " ==> " + Number(tickers[key][3].price));
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
        //console.log(JSON.stringify(result));
        console.log(rtnMsg);
        if (sendTelegram) bot.telegrambot.sendMessage(bot.channedId, rtnMsg, {parse_mode : "markdown"});
        res.status(200).json(result);
    });
    //res.send("respond with a resource");
});

router.get(['/check/:pair'], function(req, res, next) {
    var source = 'upbit';
    var pair = req.params.pair;
    if (!pair) {
        var rtnMsg = "/check/BTC-KRW";
        return res.status(200).json(rtnMsg);
    }
    Ticker.find()
    .where('source').equals(source)
    .where('pair').equals(pair)
    .sort({'created':1}).select('-_id created price bidVolume askVolume volumeRank')
    .then(function(tickers){
        var newTickers = com.tempFunc(tickers);
        res.status(200).json(newTickers);
    })
    .catch(function(err){
        console.error(err);
    });


});

module.exports = router;

