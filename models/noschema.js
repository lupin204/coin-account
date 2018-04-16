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
const noSchema = new Schema({}, {strict: false});

module.exports = mongoose.model('noschema', noSchema);