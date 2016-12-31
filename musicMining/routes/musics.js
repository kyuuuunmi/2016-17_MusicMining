//like unlike~~
const express = require('express');
const router = express.Router();
var mysql =require('mysql');
var db_config = require('../config/db_config.json');


var pool = mysql.createPool({
  host : db_config.host,
  port : db_config.port,
  user : db_config.user,
  password : db_config.password,
  database : db_config.database,
  connectionLimit : db_config.connectionLimit
});

router.route('/musics')
      .post(like)
      .delete(unlike)


function like(req, res){
  pool.getConnection(function(err, connection){
    if (err){
      console.log("getConnection Error" + err);
      res.sendStatus(0);

    }
    else{
      connection.query('insert into music_like (user_id, music_id) values (?,?);',[req.body.user_id],[req.body.music_id],function(err){
        if (err){
          console.log("Connection Error" + err);

          res.sendStatus(0);
          connection.release();
        }
        else {
          console.log("liked");
          res.sendStatus(1);

          connection.release();
        }
      });
    }
  });


}

function unlike(req,res){
  pool.getConnection(function(err, connection){
    if (err){
      console.log("getConnection Error" + err);
      res.sendStatus(0);

    }

    else{
      connection.query('delete from music_like where user_id= ? && music_id=?;',[req.body.user_id],[req.body.music_id],function(err){
        if (err){
          console.log("Connection Error" + err);
          res.sendStatus(0);

          connection.release();
        }
        else {
          console.log("unliked");

          res.sendStatus(1);

          connection.release();
        }
      });
    }
  });

}
module.exports = router;
