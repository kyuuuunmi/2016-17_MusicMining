var express = require('express');
var router = express.Router();
var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');
var mysql = require('mysql');
var db_config = require('../config/db_config.json');
aws.config.loadFromPath('./config/aws_config.json');

var s3 = new aws.S3();

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'sopt-yuuuunmi',
    acl: 'public-read',
    key: function (req, file, cb){
      cb(null, 'MusicMinning/'+Date.now() + '.' + file.originalname.split('.').pop() );
    }
  })
});

var pool = mysql.createPool({
  host: db_config.host,
  port : db_config.port,
  user : db_config.user,
  password : db_config.password,
  database : db_config.database,
  connectionLimit : db_config.connectionLimit
});


router.post('/', upload.single('contents'), function(req, res, next){
  pool.getConnection(function(error, connection){
    if(error){
      console.log("getConnection Error" + error);
      res.sendStatus(500);
    }
    else {
      var sql, inserts;
      if(req.file){
        sql = 'inserts into music (title, lyrics, highlight_video_url, genre, music_url, thumbnail_url, ) values(?,?)';
      }
    }
  })
});
