const mongoose = require('mongoose');

//local
const local_info = 'mongodb://localhost:27017/local';
//mlab_유료
const mlab_info = process.env.MLAB_MONGO_INFO;


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
