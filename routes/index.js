var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var pool = mysql.createPool({
  host: '192.168.99.100',
  port: 32770,
  connectionLimit: 10,
  user: 'root',
  password: 'password',
  database: 'mysql'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  pool.getConnection(function(err,con){
    //callback값인 con을 이용하여 쿼리문 때리기
    con.query('select * from nodemysql',function(err,result){
      res.render('index', { data: result });
      con.release();
        //callback값인 result를 이용하면 끝!
    });
  });
});

module.exports = router;
