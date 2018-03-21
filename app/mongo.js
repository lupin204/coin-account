const mongoose = require('mongoose');

/*
mongodb://lupin204:<dbpassword>@ds229458.mlab.com:29458/coinbalance
*/
const local_info = 'mongodb://localhost:27017/local';
//const mlab_info = 'mongodb://lupin204:lupin204@ds121259.mlab.com:29458/coinbalance';
const mlab_info = 'mongodb://lupin204:lupin204@ds121099.mlab.com:21099/coinbalance_free';

module.exports = () => {
  function connect() {
    mongoose.connect(mlab_info, function(err) {
      if (err) {
        console.error('mongodb connection error', err);
      }
      console.log('mongodb connected');
    });
  }
  connect();
  mongoose.connection.on('disconnected', connect);
};
