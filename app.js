// [express-generator default modules]
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// [routes]
var index = require('./routes/index');
var users = require('./routes/users');
var testapi = require('./routes/api');
var testapi2 = require('./routes/api2');
const adminApi = require('./routes/adminApi');

// [user-defined modules]
//const schedule = require('./app/schedule');
const scheduleTicker = require('./app/scheduleTicker');
const mongoose = require('./app/mongo');
const telegrambot = require('./app/telegrambot');

//----------------------------------------------------------

// [start MongoDB]
// mongoose 기본 promise를 node의 promise로 교체
// mongoose.Promise = require('bluebird');
mongoose.Promise = global.Promise;
mongoose();

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/api', testapi);
app.use('/api2', testapi2);
app.use('/admin/', adminApi);

app.use(function(req, res, next) {
  console.log("app - schedule - start");
  //scheduleTicker.exchangeJob();
  //scheduleTicker.getTickers();
  //scheduleTicker.getTickers2();
  //scheduleTicker.getTickers3();
  //scheduleTicker.getTickers4();

  //schedule.crawlingCoins();
  //schedule.checkPump();
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
