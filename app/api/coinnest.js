/*
var getTickers2 = schedule.scheduleJob('* * * 1 1 *', function(){
    //var getTickers2 = schedule.scheduleJob('2 * * * * *', function(){
        var source = 'coinnest';
    
        var reqUrl = 'https://api.coinnest.co.kr/api/pub/tickerall';
    
        request(reqUrl, function(err, res, body){
            if (!err && res.statusCode === 200) {
                var json = JSON.parse(body);
                if (Object.keys(json).length > 0) {
                    console.log("[" + source + "] " + Object.keys(json).length + " tickers is selected");
                    for(key in json) {
                        var elem = json[key];
                        var tickerCollection = new Ticker();
                        tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm00');
                        tickerCollection.source = source;
                        tickerCollection.market = key.split("_")[0];    // KRW
                        tickerCollection.coin = key.split("_")[1];      // TRON
                        tickerCollection.price = json[key].last;
                        tickerCollection.volume = json[key].vol;
    
                        tickerCollection.save(function(err, tickerCollection){
                            if(err) {
                                console.error(err);
                            }
                        });
                    }
                } 
            }
        });
        setTimeout(() => {
            console.log('[coinnest] timeout 100ms - ' + moment().utcOffset(9).format('YYYYMMDDHHmm00'));
        }, 100);
    });
*/