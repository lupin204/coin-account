var com;
com = {
    toSatoshiFormat : function(value){
        if (typeof(value) == 'undefined') { value = 0; }
        return Number(value) * 100000000;
    },
    // function([], group by attribute string)
    groupByArray = function(xs, key) {
        return xs.reduce(function(rv, x) {
          (rv[x[key]] = rv[x[key]] || []).push(x);
          return rv;
        }, {});
    }
}


module.exports = com;
