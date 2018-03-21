var com;
com = {
    toSatoshiFormat : function(value, market){
        if (typeof(value) == 'undefined') value = 0;
        if (typeof(market) == 'undefined') market = 'BTC';
        return (market.toUpperCase() === 'BTC') ? parseInt(Number(value)*100000000) : Number(value);
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
            elem.bidVolume = json[i].bidVolume;
            elem.askVolume = json[i].askVolume;
            elem.volumeRank = json[i].volumeRank;

            json[i].priceGap = Number((json[i].price / json[i-1].price - 1)*100).toFixed(2) + "%";
            json[i].bidVolumeGap = ""+Math.round(json[i].bidVolume - json[i-1].bidVolume);
            json[i].askVolumeGap = ""+Math.round(json[i].askVolume - json[i-1].askVolume);
            json[i].bidVolumeGapPrice = ""+Math.round(json[i].bidVolumeGap * json[i].price);
            json[i].askVolumeGapPrice = ""+Math.round(json[i].askVolumeGap * json[i].price);
            json[i].volumeGap = ""+Math.round(json[i].bidVolumeGap - json[i].askVolumeGap);
            json[i].volumeGapPrice = ""+Math.round(json[i].volumeGap * json[i].price);

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
    setComma : function(num) {
        if(num == undefined) val = '0';
        num += '';
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}


module.exports = com;
