// [express-generator default modules]
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// [additional modules]
var mongoose = require('mongoose');

// [routes]
var index = require('./routes/index');
var users = require('./routes/users');
var testapi = require('./routes/api');

// [user-defined modules]
var schedule = require('./app/schedule');

//----------------------------------------------------------

// [configure MongoDB]
/*
var db = mongoose.connection;
db.on('error', console.log(error));
db.once('open', function(){
  // connected to MongoDB server
  console.log("Connected to mongod server");
});
// mongoose.connect('mongodb://username:password@host:port/database?options...');
mongoose.connect('mongodb://localhost:27017/local');
*/

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.engine('html', require('ejs').renderFile);
//app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/api', testapi);

app.use(function(req, res, next) {
  console.log("app - schedule - start");
  schedule.jj();
  console.log("app - schedule - end");
  next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
