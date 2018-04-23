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
const Balance = require('../models/balance');

// user-defined
const constants = require('../app/constants');
const com = require('../app/common.js');
const bot = require('../app/telegrambot');

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
var myRule = {hour: 0, minute: 0, dayOfWeek: 1, month: [0, 3, 6, 9]};
*/
// exchange rates scheduling : 매일 낮12시/밤12시 0분 30초
var nowBalanceJob = schedule.scheduleJob({second: 30, hour: [0,12]}, function(){
 
    console.log("[Check Balance] "+ "Now getting balances from Coinmarketcap at " + moment().format('YYYY-MM-DD HH:mm'));
    var baseUrl = 'https://coinmarketcap.com/currencies/';

    var tasks = [
        function(callback){
            Exchange.findOne()
            .where('currency').equals('USD')
            .sort({'created':-1})
            .limit(1)
            .select('rates')
            .then(function(exchange) {
                callback(null, exchange.rates);
            });
        },
        function(usdExchange, callback){
            Balance.find().select('source name volume')
            .then(function(balances) {
                callback(null, balances, usdExchange);
            })
            .catch(function(err){
                console.error(err);
            });
        },
        function(balances, usdExchange, callback){
            console.log(usdExchange);
            balances.forEach(element => {
                var reqUrl = baseUrl + element.name;
                console.log(reqUrl);
                request(reqUrl, function(err, res, body){
                    if (!err && res.statusCode === 200) {
                        var $ = cheerio.load(body);
                        var nowPrice = $('#quote_price > .text-large2').text();
                        nowPrice = nowPrice ? Number(nowPrice.replace(/,/gi, '')) : 0;
                        var nowSatoshi = $(".text-gray.details-text-medium").eq(0).find('span').text();
                        nowSatoshi = nowSatoshi ? nowSatoshi*100000000 : 0;

                        var updateJson = {
                            'satoshi': (nowSatoshi).toFixed(),
                            'price': (nowPrice * usdExchange).toFixed(2),
                            'estimate': (nowPrice * usdExchange * element.volume).toFixed(2),
                            'modified': moment().utcOffset(9).format('YYYYMMDDHH')
                        };

                        Balance.findByIdAndUpdate(element.id, updateJson, {new: false});

                    } else {
                        console.log("[" + element.name + "] coin is absent from Coinmarketcap.com!");
                    }
                });
            });

        }
    ];

    async.waterfall(tasks, function(err, result){
        if(err) console.error(err);
    });
});
