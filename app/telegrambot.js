const TelegramBot = require('node-telegram-bot-api');
const Moment = require('moment');

const Exchange = require('../models/exchange');
const Ticker = require('../models/ticker');

// replace the value below with the Telegram token you receive from @BotFather

//coinbox_testbot
const token = process.env.TELEGRAM_TOKEN_TEST;

// test channel
const channedId = '@lupin204';
// usdt channel
//const channedId = '@lupin204usdt';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const reqMsg = msg.text.toString().toLowerCase();

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, '[Echo] ' + msg.text);

  if (reqMsg == 'exchange') {
    Exchange.find()
    .where('created').equals(Moment().utcOffset(9).format('YYYYMMDDHH0000')).select('currency rates created')
    .then(function(exchanges) {
      var created = exchanges[0].created
      var message = '[환율정보]\n';
      message += created.substr(0, 4) + '-' + created.substr(4, 2) + '-' + created.substr(6, 2) + ' ' + created.substr(8, 2) + '시 기준(GMT+9)\n'
        
      exchanges.forEach(function(exchange){
        message += exchange.currency + " : " + exchange.rates.toFixed(2) + "\n";
      });

      bot.sendMessage(chatId, message);
    })
    .catch(function(err){
        console.error(err);
    });
  } else if (reqMsg.startsWith('upbit') || reqMsg.startsWith('coinrail') || reqMsg.startsWith('coinnest')) {
    // upbit ada krw
    var sourceParam = reqMsg.split(" ")[0];
    var coinParam = (reqMsg.split(" ")[1] === undefined) ? 'BTC' : reqMsg.split(" ")[1].toUpperCase();
    var marketParam = (reqMsg.split(" ")[2] === undefined) ? 'KRW' : reqMsg.split(" ")[2].toUpperCase();
    Ticker.findOne()
    .where('source').equals(sourceParam).where('coin').equals(coinParam).where('market').equals(marketParam)
    .sort({'createdDate': -1}).limit(1)
    .select('created coin market price')
    .then(function(ticker){
      console.log(ticker);
      var message = '[가격정보]\n';
      if (ticker == null) {
        message += reqMsg + " 정보가 없습니다";
      } else {
        var formattedPrice = ticker.price;
        if (ticker.market === 'KRW') {
          formattedPrice = ticker.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else if (ticker.market === 'BTC' || ticker.market === 'ETH') {
          formattedPrice = Number(ticker.price).toFixed(8);
        }
        message += sourceParam + '-' + ticker.coin + '-' + ticker.market + ' : ' + formattedPrice;

      }

      bot.sendMessage(chatId, message);
    })
    .catch(function(err){
      console.error(err);
    });
  }

});

module.exports = {
    'telegrambot' : bot,
    'channedId' : channedId
}