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
const marketSchema = new Schema({
    
    /*created: { type: String, required: true, unique: true, index: true},*/
    source: { type: String, required: true},    // Upbit
    fullname: {type: String, required: true},   // Bitcoin
    coin: {type: String, required: true},   // BTC
    market: {type: String, required: true}, // KRW
    pair: { type: String, required: true},  // BTC/KRW
    created: { type: String, required:true },   //20180206150000
    createdDate: {type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('market', marketSchema);