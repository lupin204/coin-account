var com;
com = {
    toSatoshiFormat : function(value){
        if (typeof(value) == 'undefined') { value = 0; }
        return Number(value) * 100000000;
    }
}


module.exports = com;
