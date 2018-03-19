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
    }
}


module.exports = com;
