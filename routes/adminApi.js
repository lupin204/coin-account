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

router.get(['/pump/:pair'], function(req, res, next) {
    var source = 'upbit';
    var pair = req.params.pair;
    var fromDate = req.query.from;
    var toDate = req.query.to;
    fromDate = !fromDate ? '20180101000000' : fromDate.replace('-','').replace(/\s/gi,'');
    toDate = !toDate ? '20181231235900' : toDate.replace('-','').replace(/\s/gi,'');
    fromDate = (fromDate.length == 12) ? (fromDate+'00') : fromDate;
    toDate = (toDate.length == 12) ? (toDate+'00') : toDate;
    
    var tasks = [
        function(callback){
            Ticker.find()
            .where('source').equals(source)
            .where('pair').equals(pair)
            .where('created').gte(fromDate).where('created').lte(toDate)
            .sort({'created':1}).select('-_id created volume price bidVolume askVolume volumeRank')
            .then(function(tickers){
                var groupedTickers = com.groupByArray(tickers);
                var newTickers = com.tempFunc2(groupedTickers);
                callback(null, newTickers);
            })
            .catch(function(err){
                console.error(err);
            });
        },
        function(tickers, callback){
            
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

            callback(null, tickers, rtnMsg, sendTelegram);
        }
    ];

    async.waterfall(tasks, function(err, result, rtnMsg, sendTelegram){
        if (err){
            res.status(500).json({error: 'system error'});
        }
        //res.status(200).json(result);
        if (sendTelegram) {
            //bot.telegrambot.sendMessage(bot.channedId, rtnMsg);
            res.status(200).json(rtnMsg);
        } else {
            //bot.telegrambot.sendMessage(bot.channedId, "no pump");
            res.status(200).json("no pump");            
        }
    });
});

router.get(['/check/:pair'], function(req, res, next) {
    var source = 'upbit';
    var pair = req.params.pair;
    var fromDate = req.query.from;
    var toDate = req.query.to;
    fromDate = !fromDate ? '20180101000000' : fromDate.replace('-','').replace(/\s/gi,'');
    toDate = !toDate ? '20181231235900' : toDate.replace('-','').replace(/\s/gi,'');
    fromDate = (fromDate.length == 12) ? (fromDate+'00') : fromDate;
    toDate = (toDate.length == 12) ? (toDate+'00') : toDate;
    if (!pair) {
        var rtnMsg = "/check/BTC-KRW";
        return res.status(200).json(rtnMsg);
    }

    Ticker.find()
    .where('source').equals(source)
    .where('pair').equals(pair)
    .where('created').gte(fromDate).where('created').lte(toDate)
    .sort({'created':1}).select('-_id created market price volume bidVolume askVolume volumeRank')
    .then(function(tickers){
        var newTickers = com.tempFunc(tickers);
        res.status(200).json(newTickers);
    })
    .catch(function(err){
        console.error(err);
    });
});

router.get(['/check2/:pair'], function(req, res, next) {
    var source = 'upbit';
    var pair = req.params.pair;
    var fromDate = req.query.from;
    var toDate = req.query.to;

    fromDate = !fromDate ? '20180101000000' : fromDate.replace('-','').replace(/\s/gi,'');
    toDate = !toDate ? '20181231235900' : toDate.replace('-','').replace(/\s/gi,'');
    fromDate = (fromDate.length == 12) ? (fromDate+'00') : fromDate;
    toDate = (toDate.length == 12) ? (toDate+'00') : toDate;
    if (!pair) {
        var rtnMsg = "/check/BTC-KRW";
        return res.status(200).json(rtnMsg);
    }

    Ticker.find()
    .where('source').equals(source)
    .where('pair').equals(pair)
    .where('created').gte(fromDate).where('created').lte(toDate)
    .sort({'created':1}).select('-_id created price volume bidVolume askVolume volumeRank')
    .then(function(tickers){
        var groupedTickers = com.groupByArray(tickers);
        var newTickers = com.tempFunc2(groupedTickers);
        res.status(200).json(newTickers);
    })
    .catch(function(err){
        console.error(err);
    });
});


router.get(['/getTickersUpbit/'], function(req, res, next) {
    res.status(200).json(com.tickersUpbit);
});

router.get(['/getTickersTempUpbit/'], function(req, res, next) {
    var tickers = com.tickersUpbit;
    if (Object.keys(tickers).length > 0 && tickers[Object.keys(tickers)[0]].length > 1) {
        res.status(200).json(com.tempFunc2(tickers));
    } else {
        res.status(200).json("not yet");
    }
});



module.exports = router;

