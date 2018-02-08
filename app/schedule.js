const schedule = require("node-schedule");
const moment = require('moment');
const request = require('request');
const cheerio = require('cheerio');

const constants = require('../app/constants');
const Exchange = require('../models/exchange');
const Market = require('../models/market');

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


var crawlingCoins = schedule.scheduleJob('* * * * * 1', function(){
    console.log('crawling coinmarketcap');
    var reqUrl = 'https://coinmarketcap.com/exchanges/upbit/';

    request(reqUrl, function(err, res, body){
        if (!err && res.statusCode === 200) {
            var $ = cheerio.load(body);
            var coinCnt = $('#exchange-markets > tbody > tr').length;
            var createdDate = moment().format('YYYYMMDD');

            for (var i=1; i<=coinCnt; i++) {
                var elem = $('#exchange-markets > tbody > tr:nth-child('+i+') > td:nth-child(3) > a').text();
                var coin = elem.split('/')[0];
                var market = elem.split('/')[1];

                var marketCollection = new Market();
                marketCollection.source = 'Upbit';
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

});



module.exports = {
    'jj' : jj,
    'exchangeJob': exchangeJob,
    'crawlingCoins': crawlingCoins
};