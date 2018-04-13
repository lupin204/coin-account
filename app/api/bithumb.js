/*
var getTickers = schedule.scheduleJob('* * * 1 1 *', function(){
    //var getTickers = schedule.scheduleJob('1 * * * * *', function(){
        var source = 'bithumb';
    
        var reqUrl = 'https://api.bithumb.com/public/ticker/all';
    
        request(reqUrl, function(err, res, body){
            if (!err && res.statusCode === 200) {
                var json = JSON.parse(body);
                if (json.status === '0000' && Object.keys(json.data).length > 0) {
                    delete json.data['date'];
                    console.log("[" + source + "] " + Object.keys(json.data).length + " tickers is selected");
                    for(key in json.data) {
                        var elem = json.data[key];
                        var tickerCollection = new Ticker();
                        tickerCollection.created = moment().utcOffset(9).format('YYYYMMDDHHmm00');
                        tickerCollection.source = source;
                        tickerCollection.market = 'KRW';
                        tickerCollection.coin = key;
                        tickerCollection.price = json.data[key].closing_price;
                        tickerCollection.volume = json.data[key].units_traded;
    
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
            console.log('[bithumb] timeout 100ms - ' + moment().utcOffset(9).format('YYYYMMDDHHmm00'));
        }, 100);
    });
*/