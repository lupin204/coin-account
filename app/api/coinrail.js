/*
var getTickers3 = schedule.scheduleJob('* * * 1 1 *', function(){
    //var getTickers3 = schedule.scheduleJob('3 * * * * *', function(){
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
        setTimeout(() => {
            console.log('[coinrail] timeout 100ms - ' + moment().utcOffset(9).format('YYYYMMDDHHmm00'));
        }, 100);
    });
*/   