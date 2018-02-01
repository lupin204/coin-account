var express = require('express');
var request = require('request');
var router = express.Router();





/*
var reqOptions = {
    host: url,  // no http plz.
    path: path, // rest
    method: 'GET'
}
*/

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
router.get(['/bithumb/:coin/'], function(req, res, next) {
    console.log("bithumb");
    var coin = req.params.coin;
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
router.get(['/upbit/:coin'], function(req, res, next) {
    console.log("upbit");
    var coin = req.params.coin;
    var reqUrl = 'https://crix-api-endpoint.upbit.com/v1/crix/candles/days?code=CRIX.UPBIT.KRW-' + coin;

    request(reqUrl, function(err, res, body){
        
        if (!err && res.statusCode === 200) {
            console.log(body);
            var json = JSON.parse(body);
            if (json.length > 0) {
                console.log(json[0].tradePrice);
            }
        }
    });
    res.send('respond with a resource');
});


router.get(['/binance/:coin'], function(req, res, next) {
    console.log("binance");
    var coin = req.params.coin;
    var reqUrl = 'https://api.binance.com/api/v1/ticker/24hr';

    request(reqUrl, function(err, res, body){
        
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
