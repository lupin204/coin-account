var com;
com = {

    changeRate : null,

    changeTime : null,

    isApp : false,

    tickersUpbit : {},

    tickerUpbitBtc : 10000000,
    
    toSatoshiFormat : function(value, market){
        if (typeof(value) == 'undefined') value = 0;
        if (typeof(market) == 'undefined') market = 'BTC';
        return (market.toUpperCase() === 'BTC') ? parseInt(Number(value)*100000000) : Number(value);
    },
    btcToKrw : function(value, market) {
        if (typeof(value) == 'undefined') value = 0;
        if (typeof(market) == 'undefined') market = 'KRW';
        return (market.toUpperCase() === 'BTC') ? parseInt(Number(value)*com.tickerUpbitBtc) : Number(value);
    },
    // function([], group by attribute string)
    groupByArray : function(xs, key) {
        return xs.reduce(function(rv, x) {
          (rv[x[key]] = rv[x[key]] || []).push(x);
          return rv;
        }, {});
    },
    tempFunc : function(json) {
        var rtn = [];
        for (var i=1; i<json.length; i++) {
            var elem = {};
            elem.created = json[i].created;
            elem.price = json[i].price;
            elem.volume = json[i].volume;
            elem.bidVolume = json[i].bidVolume;
            elem.askVolume = json[i].askVolume;
            elem.volumeRank = json[i].volumeRank;

            json[i].priceGap = Number((json[i].price / json[i-1].price - 1)*100).toFixed(2) + "%";
            json[i].bidVolumeGap = ""+Math.round(json[i].bidVolume - json[i-1].bidVolume);
            json[i].askVolumeGap = ""+Math.round(json[i].askVolume - json[i-1].askVolume);
            json[i].bidVolumeGapPrice = ""+Math.round(com.btcToKrw(json[i].bidVolumeGap, json[i].market) * json[i].price);
            json[i].askVolumeGapPrice = ""+Math.round(com.btcToKrw(json[i].askVolumeGap, json[i].market) * json[i].price);
            json[i].accVolumeGap = ""+Math.round(json[i].accVolume - json[i-1].accVolume);
            json[i].volumeGap = ""+Math.round(json[i].bidVolumeGap - json[i].askVolumeGap);
            //json[i].test = ""+Math.round(json[i].accVolumeGap - json[i].bidVolumeGap - json[i].askVolumeGap);
            json[i].volumeGapPrice = ""+Math.round(com.btcToKrw(json[i].volumeGap, json[i].market) * json[i].price);

            elem.bidVolumeGap = json[i].bidVolumeGap.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            elem.askVolumeGap = json[i].askVolumeGap.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            elem.bidVolumeGapPrice = json[i].bidVolumeGapPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            elem.askVolumeGapPrice = json[i].askVolumeGapPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            elem.volumeGap = json[i].volumeGap.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            elem.accVolumeGap = json[i].accVolumeGap.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            //elem.test = json[i].test;
            elem.volumeGapPrice = json[i].volumeGapPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            rtn.push(elem);
        }
        return rtn;
    },
    tempFunc2 : function(json) {
        var rtn = [];
        for (key in json) {
            var elem = {};
            elem.created = json[key][1].created;
            elem.pair = json[key][0].pair;
            elem.market = json[key][0].market;
            elem.coin = json[key][0].coin;
            elem.price = json[key][1].price;
            elem.fromPrice = json[key][0].price;
            elem.fromVolume = json[key][0].accVolume;
            elem.toVolume = json[key][1].accVolume;
            elem.fromVolumeRank = Number(json[key][0].volumeRank);
            elem.volumeRank = Number(json[key][1].volumeRank);
            elem.priceGapNum = com.toSatoshiFormat(json[key][1].price - json[key][0].price, json[key][0].market);

            elem.priceGap = Number((json[key][1].price / json[key][0].price - 1)*100).toFixed(2);
            elem.bidVolumeGap = Math.round(json[key][1].bidVolume - json[key][0].bidVolume);
            elem.askVolumeGap = Math.round(json[key][1].askVolume - json[key][0].askVolume);
            elem.bidVolumeGapPrice = Math.round(com.btcToKrw(elem.bidVolumeGap, elem.market) * elem.price);
            elem.askVolumeGapPrice = Math.round(com.btcToKrw(elem.askVolumeGap, elem.market) * elem.price);
            elem.volumeGap = elem.bidVolumeGap - elem.askVolumeGap;
            elem.accVolumeGap = Math.round(json[key][1].accVolume - json[key][0].accVolume);
            elem.volumeGapPrice = Math.round(com.btcToKrw(elem.volumeGap, elem.market) * elem.price);
            elem.volumeRankGap = Number(json[key][0].volumeRank - json[key][1].volumeRank);
            rtn.push(elem);
        }
        return rtn;
    },
    setComma : function(num) {
        if(num == undefined) val = '0';
        num += '';
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    binanceFunc : function(json) {
        var rtn = [];
        for (var i=1; i<json.length; i++) {
            var elem = {};
            elem.createdDate = json[i].createdDate;
            /*
            elem.priceChange = json[i].priceChange;
            elem.priceChangePercent = json[i].priceChangePercent;
            elem.weightedAvgPrice = json[i].weightedAvgPrice;
            elem.prevClosePrice = json[i].prevClosePrice;
            elem.lastPrice = json[i].lastPrice;
            elem.lastQty = json[i].lastQty;
            elem.bidPrice = json[i].bidPrice;
            elem.bidQty = json[i].bidQty;
            elem.askPrice = json[i].askPrice;
            elem.askQty = json[i].askQty;
            elem.openPrice = json[i].openPrice;
            elem.highPrice = json[i].highPrice;
            elem.lowPrice = json[i].lowPrice;
            elem.volume = json[i].volume;
            elem.quoteVolume = json[i].quoteVolume;
            //elem.openTime = json[i].openTime;
            //elem.closeTime = json[i].closeTime;
            elem.firstId = json[i].firstId;
            elem.lastId = json[i].lastId;
            elem.count = json[i].count;
            */

            elem.priceChangeGap = (json[i].priceChange - json[i-1].priceChange).toFixed(2);
            elem.priceChangePercentGap = (json[i].priceChangePercent - json[i-1].priceChangePercent).toFixed(2);
            elem.weightedAvgPriceGap = (json[i].weightedAvgPrice - json[i-1].weightedAvgPrice).toFixed(2);
            elem.prevClosePriceGap = (json[i].prevClosePrice - json[i-1].prevClosePrice).toFixed(2);
            elem.lastPriceGap = (json[i].lastPrice - json[i-1].lastPrice).toFixed(2);
            elem.lastQtGap = (json[i].lastQty - json[i-1].lastQty).toFixed(2);
            elem.bidPriceGap = (json[i].bidPrice - json[i-1].bidPrice).toFixed(2);
            elem.bidQtyGap = (json[i].bidQty - json[i-1].bidQty).toFixed(2);
            elem.askPriceGap = (json[i].askPrice - json[i-1].askPrice).toFixed(2);
            elem.askQtyGap = (json[i].askQty - json[i-1].askQty).toFixed(2);
            elem.openPriceGap = (json[i].openPrice - json[i-1].openPrice).toFixed(2);
            elem.highPriceGap = (json[i].highPrice - json[i-1].highPrice).toFixed(2);
            elem.lowPriceGap = (json[i].lowPrice - json[i-1].lowPrice).toFixed(2);
            elem.volumeGap = (json[i].volume - json[i-1].volume).toFixed(2);
            elem.quoteVolumeGap = (json[i].quoteVolume - json[i-1].quoteVolume).toFixed(2);
            //elem.openTimeGap = (json[i].openTime - json[i-1].openTime).toFixed(2);
            //elem.closeTimeGap = (json[i].closeTime - json[i-1].closeTime).toFixed(2);
            elem.firstIdGap = (json[i].firstId - json[i-1].firstId).toFixed(2);
            elem.lastIdGap = (json[i].lastId - json[i-1].lastId).toFixed(2);
            elem.countGap = (json[i].count - json[i-1].count).toFixed(2);

            rtn.push(elem);
        }
        return rtn;
    },
}


module.exports = com;
