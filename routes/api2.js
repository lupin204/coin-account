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
const moment = require('moment');


router.get(['/test'], function(req, res, next) {
    Market.find(function(err, markets) {
        markets.forEach(function(market){

            var reqUrl = 'https://coinmarketcap.com/exchanges/upbit/';
            var createdDate = moment().format('YYYYMMDD');

            request(reqUrl, function(err, res, body){
                if (!err && res.statusCode === 200) {
                    var $ = cheerio.load(body);
                    var coinCnt = $('#exchange-markets > tbody > tr').length;
        
                    for (var i=1; i<=coinCnt; i++) {
                        var elem = $('#exchange-markets > tbody > tr:nth-child('+i+') > td:nth-child(3) > a').text();

                        if (market.pair )

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

            console.log(elem.coin);
            console.log("~~~~~~~~~~~~~");
        });
    }).where('source').equals('Upbit').select('-_id pair');

/*
    source: { type: String, required: true},    // Upbit
    coin: {type: String, required: true},   // BTC
    market: {type: String, required: true}, // KRW
    pair: { type: String, required: true},  // BTC/KRW
    updated: { type: String, required:true },   //20180206150000
*/
    res.send('respond with a resource');
});


router.get(['/test2'], function(req, res, next) {
    console.log("test2222");
    var reqUrl = 'https://coinmarketcap.com/exchanges/upbit/';
    var createdDate = moment().format('YYYYMMDD');
    var coinmarketcaps = [];

    var tasks = [
        function(callback){
            Market.find()
            .where('source').equals('Upbit').select('pair')
            .then(function(markets) {
                console.log(markets.length);
                var marketArray = [];
                for (var i=0; i<markets.length; i++) {
                    marketArray[i] = markets[i].pair;
                }
                console.log(marketArray);
                callback(null, marketArray);
            })
            .catch(function(err){
                console.error(err);
            });
        },

        function(marketArray, callback){
            console.log(marketArray);
            request(reqUrl, function(err, res, body){
                if (!err && res.statusCode === 200) {
                    var $ = cheerio.load(body);
                    var coinCnt = $('#exchange-markets > tbody > tr').length;
                    for (var i=1; i<=coinCnt; i++) {
                        var elem = $('#exchange-markets > tbody > tr:nth-child('+i+') > td:nth-child(3) > a').text();
                        if (marketArray.indexOf(elem) > -1) {
                            marketArray.pop(elem);
                        } else {
                            console.log(elem);
                        }
                    }
                    callback(null, marketArray);
                }
            });
        }
    ];


    async.waterfall(tasks, function (err, result) {
        if (err) {
            console.log(err);
        } else {
           console.log(result.length);
        }
      });

    

    res.send('respond with a resource');
});

router.get(['/test3'], function(req, res, next) {

    var aaa = 'aaa';
    var bbb = 'bbb';

    var tasks = [
        function(callback){
            console.log("1111111111111111111111");
            console.log(aaa);
            aaa += 'aaa1';
            console.log(callback);
          callback(null, '하나', '둘');
        },
        function(arg1, arg2, callback){
            console.log("2222222222222222");
            console.log(bbb);
          // arg1는 '하나'고, arg2는 '둘'이다.
          console.log(arg1);
          console.log(arg2);
          console.log(callback);
          callback(null, '셋');
        },
        function(arg1, callback){
            console.log("333333333333333");
          // arg1은 '셋'이다.
          console.log(arg1);
          console.log(callback);
          callback(null, '끝');
        }
      ];

    async.waterfall(tasks, function (err, result) {
        // result에는 '끝'이 담겨 온다.
        if (err)
        console.log(err);
        else {
        console.log(result);
        console.log(aaa);
        }
      });

      console.log(aaa);


    res.send('respond with a resource');
});


/*
var reqOptions = {
    host: url,  // no http plz.
    path: path, // rest
    method: 'GET'
}
*/


/* bitfinex */
var BITFINEX_COINS = 'tBTCUSD,tETHUSD';

router.get(['/bitfinex/tickers'], function(req, res, next) {
    console.log("bitfinex tickers");
    var reqUrl = 'https://api.bitfinex.com/v2/tickers?symbols=' + BITFINEX_COINS;

    request(reqUrl, function(err, res, body){
        console.log(body);
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (json.length > 0) {
                json.forEach(function(elem){
                    if (elem[0] === ('t'+coin+market)) {
                        console.log(elem[0] + " ~~ " + elem[7]);
                    }
                });
            } else {
                console.log("no such coin.");
            }
        }
    });
    //request.post('http://service.com/upload', {form:{key:'value'}})
    //res.json({'a':'1'});
  res.send('respond with a resource');
});

router.get(['/bitfinex2/:coin?/:market?'], function(req, res, next) {
    console.log("bitfinex2");
    var coin = req.params.coin;
    var market = req.params.market;
    coin = (!coin) ? "BTC" : coin.toUpperCase();
    market = (!market) ? "USD" : market.toUpperCase();
    var reqUrl = 'https://api.bitfinex.com/v2/tickers?symbols=tETHUSD,tXRPUSD,t' + coin + market;

    request(reqUrl, function(err, res, body){
        console.log(body);
        if (!err && res.statusCode === 200) {
            var json = JSON.parse(body);
            if (json.length > 0) {
                json.forEach(function(elem){
                    if (elem[0] === ('t'+coin+market)) {
                        console.log(elem[0] + " ~~ " + elem[7]);
                    }
                });
            } else {
                console.log("no such coin.");
            }
        }
    });
    //request.post('http://service.com/upload', {form:{key:'value'}})
    //res.json({'a':'1'});
  res.send('respond with a resource');
});

/* BITHUMB */
/*
{"status":"0000",
"data":{
    "opening_price":"11332000",
    "closing_price":"10721000",
    "min_price":"10621000",
    "max_price":"11480000",
    "average_price":"11188388.7569",
    "units_traded":"7995.53692225",
    "volume_1day":"7995.53692225",
    "volume_7day":"72268.64547665",
    "buy_price":"10721000",
    "sell_price":"10726000",
    "date":"1517482470746"}
}
*/
/* ERROR_MSG
CODE	MESSAGE
5100	Bad Request
5200	Not Member
5300	Invalid Apikey
5302	Method Not Allowed
5400	Database Fail
5500	Invalid Parameter
5600	CUSTOM NOTICE (상황별 에러 메시지 출력)
5900	Unknown Error
*/
router.get(['/bithumb/:coin?/'], function(req, res, next) {
    console.log("bithumb");
    var coin = req.params.coin;
    coin = (!coin) ? "BTC" : coin.toUpperCase();
    console.log(coin);
    var reqUrl = 'https://api.bithumb.com/public/ticker/' + coin;

    request(reqUrl, function(err, res, body){
        console.log(body);
        if (!err && res.statusCode === 200) {
            console.log(body);
            var json = JSON.parse(body);
            if (json.status === '0000') {
                console.log(json.data.closing_price);
            }
        }
    });
    //request.post('http://service.com/upload', {form:{key:'value'}})
    //res.json({'a':'1'});
  res.send('respond with a resource');
});

/* UPBIT */
/*
[{"code":"CRIX.UPBIT.KRW-BTC",
"candleDateTime":"2018-02-01T00:00:00+00:00",
"candleDateTimeKst":"2018-02-01T09:00:00+09:00",
"openingPrice":11439000.00000000,
"highPrice":11490000.00000000,
"lowPrice":10623000.00000000,
"tradePrice":10798000.00000000,
"candleAccTradeVolume":8693.37083548,
"candleAccTradePrice":96610012548.89569000,
"timestamp":1517482315583,
"prevClosingPrice":11429000.00000000,
"change":"FALL",
"changePrice":631000.00000000,
"changeRate":0.0552104296,
"signedChangePrice":-631000.00000000,
"signedChangeRate":-0.0552104296}]
*/
/* ERROR_MSG
[]
*/
router.get(['/upbit/:coin?/:market?'], function(req, res, next) {
    console.log("upbit");
    var coin = req.params.coin;
    var market = req.params.market;
    coin = (!coin) ? "BTC" : coin.toUpperCase();
    market = (!market) ? "KRW" : market.toUpperCase();
    var reqUrl = 'https://crix-api-endpoint.upbit.com/v1/crix/candles/days?code=CRIX.UPBIT.' + market + '-' + coin;

    request(reqUrl, function(err, res, body){
        
        if (!err && res.statusCode === 200) {
            console.log(body);
            var json = JSON.parse(body);
            if (json.length > 0) {
                var tradePrice = json[0].tradePrice;
                if (market === 'BTC') {
                    tradePrice = com.toSatoshiFormat(tradePrice);
                }
                console.log(tradePrice);
            } else {
                console.log("no such coin.");
            }
        }
    });
    res.send('respond with a resource');
});


router.get(['/binance'], function(req, res, next) {
    console.log("binance");
    var coin = req.params.coin;
    var market = req.params.market;
    coin = (!coin) ? "BTC" : coin.toUpperCase();
    market = (!market) ? "USDT" : market.toUpperCase();
    var reqUrl = 'https://api.binance.com/api/v1/ticker/24hr';

    request(reqUrl, function(err, res, body){
        console.log(err);
        if (!err && res.statusCode === 200) {
            console.log(body);
            var json = JSON.parse(body);
            //json.forEach(elem => {
            json.forEach(function(elem) {
                console.log(elem.symbol);
            });
            
        }
    });
    res.send('respond with a resource');
});


/* ERROR_MSG
0	No Error
3	내부 서버 오류
9	예상치 못한 서버 오류
4	잔액 부족으로 거래 실패
101	파라미터 값이 없음.
102	회원 정보를 찾을 수 없음. API Key 확인 필요
103	정지 계정.
104	거래 제한 계정.
105	인증실패 이메일, 휴대폰 본인인증 확인 필요
110	파라미터 오류. 입력값 확인 필요
111	인증 실패. API Key 확인 필요
112	Access Key의 권한이 부족함.
311	일일 이체한도 초과
312	월 이체한도 초과
313	최소 출금액 보다 출금요청액이 적을 경우
314	원화 입금 후 3일동안 코인출금 불가능
320	출금 계좌 미등록
999	제한된 횟수를 초과하여 호출하였을 경우.
퍼블릭 API 의 경우 1초에 20회 제한
프라이빗 API 의 경우 1초에 10회 제한
위 제한 횟수를 어길경우 5분간 정지 되어집니다.
*/
router.get(['/coinrail/:coin?/:market?'], function(req, res, next) {
    console.log("coinrail");
    var coin = req.params.coin;
    var market = req.params.market;
    coin = (!coin) ? "btc" : coin.toLowerCase();
    market = (!market) ? "krw" : market.toLowerCase();
    var reqUrl = 'https://api.coinrail.co.kr/public/last/order?currency=' + coin + "-" + market;

    request(reqUrl, function(err, res, body){
        
        if (!err && res.statusCode === 200) {
            console.log(body);
            var json = JSON.parse(body);
            if (json.error_code === 0) {
                console.log(json.last_price);
            } else {
                console.log("no such coin.");
            }
        }
    });
    res.send('respond with a resource');
});



router.get(['/gate/:coin?/:market?'], function(req, res, next) {
    console.log("gate.io");
    var coin = req.params.coin;
    var market = req.params.market;
    coin = (!coin) ? "btc" : coin.toLowerCase();
    market = (!market) ? "usdt" : market.toLowerCase();
    var reqUrl = 'https://data.gate.io/api2/1/ticker/' + coin + "_" + market;

    request(reqUrl, function(err, res, body){
        
        if (!err && res.statusCode === 200) {
            console.log(body);
            var json = JSON.parse(body);
            if (json.result === 'true') {
                console.log(json.last);
            } else {
                console.log("no such coin.");
            }
        }
    });
    res.send('respond with a resource');
});


/*
btc,bch,btg,bcd,ubtc,ltc,eth,etc,ada,qtum,xlm,neo,gas,rpx,hsr,knc,tsl,tron,omg,wtc,mco,storm,gto,pxs,chat,ink,hlc,ent,qbt,spc,put (Default: btc)
limitation : 12 / 1s
*/
/*
Code   Description
100    Access is blocked. For example, black name list.
101    Too frequent access.
102    Parameter error. Required parameters are missing or in wrong format.
104    Try to access an api using keys without enough privileges.
105    Failed to validate the signature.
106    The user is in black name list.
200    System error. Please refer to the msg content and seek for technical support.
*/
router.get(['/coinnest/:coin?/:market?'], function(req, res, next) {
    console.log("coinnest");
    var coin = req.params.coin;
    coin = (!coin) ? "btc" : coin.toLowerCase();
    var reqUrl = 'https://api.coinnest.co.kr/api/pub/ticker?coin=' + coin;

    request(reqUrl, function(err, res, body){
        
        if (!err && res.statusCode === 200) {
            console.log(body);
            if (body.startsWith('{')) {
                var json = JSON.parse(body);0000000000
                console.log(json.last);
            } else {
                console.log("no such coin.");
            }
        }
    });
    res.send('respond with a resource');
});

/*
{"success":0,"error":"not available"}
{"success":0,"error":"Invalid pair name: TAAS_ETH"}
*/
router.get(['/liqui/:coin?/:market?'], function(req, res, next) {
    console.log("liqui.io");
    var coin = req.params.coin;
    var market = req.params.market;
    coin = (!coin) ? "taas" : coin.toLowerCase();
    market = (!market) ? "eth" : market.toLowerCase();
    var reqUrl = 'https://api.liqui.io/api/3/ticker/' + coin + "_" + market;

    request(reqUrl, function(err, res, body){
        
        if (!err && res.statusCode === 200) {
            console.log(body);
            var json = JSON.parse(body);
            json.forEach(function(elem) {
                    console.log(elem);
             });                
        }
    });
    res.send('respond with a resource');
});

module.exports = router;

/*
jsonObject = JSON.stringify({
    "message" : "The web of things is approaching, let do some tests to be ready!",
    "name" : "Test message posted with node.js",
    "caption" : "Some tests with node.js",
    "link" : "http://www.youscada.com",
    "description" : "this is a description",
    "picture" : "http://youscada.com/wp-content/uploads/2012/05/logo2.png",
    "actions" : [ {
        "name" : "youSCADA",
        "link" : "http://www.youscada.com"
    } ]
});
var postheaders = {
    'Content-Type' : 'application/json',
    'Content-Length' : Buffer.byteLength(jsonObject, 'utf8')
};
var optionspost = {
    host : 'graph.facebook.com',
    port : 443,
    path : '/youscada/feed?access_token=your_api_key',
    method : 'POST',
    headers : postheaders
};
var reqPost = https.request(optionspost, function(res) {
    console.log("statusCode: ", res.statusCode);
    // uncomment it for header details
//  console.log("headers: ", res.headers);

    res.on('data', function(d) {
        console.info('POST result:\n');
        process.stdout.write(d);
        console.info('\n\nPOST completed');
    });
});
*/
