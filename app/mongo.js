const mongoose = require('mongoose');

module.exports = () => {
  function connect() {
    mongoose.connect('mongodb://localhost:27017/local', function(err) {
      if (err) {
        console.error('mongodb connection error', err);
      }
      console.log('mongodb connected');
    });
  }
  connect();
  mongoose.connection.on('disconnected', connect);
};
