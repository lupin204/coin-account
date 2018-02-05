const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/* Schema Type  http://mongoosejs.com/docs/schematypes.html
String
Number
Date
Buffer
Boolean
Mixed
Objectid
Array
*/
const exchangeSchema = new Schema({
    
    /*created: { type: String, required: true, unique: true, index: true},*/
    created: { type: String, required: true},
    base: { type: String, required: true, default: 'KRW'},
    currency: { type: String, required: true},
    rates: { type: Number, required: true },
    createdDate: {type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('exchange', exchangeSchema);