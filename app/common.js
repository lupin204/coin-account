var com;
com = {
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
            json[i].volumeGap = ""+Math.round(json[i].bidVolumeGap - json[i].askVolumeGap);
            json[i].volumeGapPrice = ""+Math.round(com.btcToKrw(json[i].volumeGap, json[i].market) * json[i].price);

            elem.bidVolumeGap = json[i].bidVolumeGap.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            elem.askVolumeGap = json[i].askVolumeGap.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            elem.bidVolumeGapPrice = json[i].bidVolumeGapPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            elem.askVolumeGapPrice = json[i].askVolumeGapPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            elem.volumeGap = json[i].volumeGap.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
            elem.fromVolumeRank = Number(json[key][0].volumeRank);
            elem.volumeRank = Number(json[key][1].volumeRank);
            elem.priceGapNum = com.toSatoshiFormat(json[key][1].price - json[key][0].price, json[key][0].market);

            elem.priceGap = Number((json[key][1].price / json[key][0].price - 1)*100).toFixed(2);
            elem.bidVolumeGap = Math.round(json[key][1].bidVolume - json[key][0].bidVolume);
            elem.askVolumeGap = Math.round(json[key][1].askVolume - json[key][0].askVolume);
            elem.bidVolumeGapPrice = Math.round(com.btcToKrw(elem.bidVolumeGap, elem.market) * elem.price);
            elem.askVolumeGapPrice = Math.round(com.btcToKrw(elem.askVolumeGap, elem.market) * elem.price);
            elem.volumeGap = elem.bidVolumeGap - elem.askVolumeGap;
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
    }
}


module.exports = com;
