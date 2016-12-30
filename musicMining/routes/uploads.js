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
        key: function(req, file, cb) {
            cb(null, 'MusicMinning/' + Date.now() + '.' + file.originalname.split('.').pop());
        }
    })
});

var pool = mysql.createPool({
    host: db_config.host,
    port: db_config.port,
    user: db_config.user,
    password: db_config.password,
    database: db_config.database,
    connectionLimit: db_config.connectionLimit
});

var uploadConts = upload.fields([{
    name: 'highlight_video'
}, {
    name: 'music'
}, {
    name: 'thumbnail'
}, {
    name: 'album_image'
}]);


router.get('/', function(req, res, next) {
  res.render('uploadss');
});

//router.post('/', upload.single('contents'), function(req, res, next){
router.post('/', uploadConts, function(req, res, next) {

    pool.getConnection(function(error, connection) {

        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
          var sql_music, sql_album, sql_musician, sql_group, sql_lyricist, sql_lyricist_role, sql_composer, sql_composer_role;
          var insert_music, insert_album, insert_musicain, insert_group, insert_lyricist,insert_composer, insert_lyricist_role;

            var sql, inserts;
            if (req.files) {
              console.log('file갓니');
                //TODO : featuring 가수 확인
                sql_music = 'insert into music (title, lyrics, highlight_video_url, genre, music_url, thumbnail_url) values(?,?,?,?,?,?)';
                insert_music = [req.body.title, req.body.lyrics, req.files['highlight_video'][0].location, req.body.genre, req.files['music'][0].location, req.files['thumbnail']];
                //
                // sql_album = 'insert into album (album_name, sale_date, album_info, album_image_url) values(?,?,?,?)';
                // insert_album = [req.body.album_name, req.body.sale_date, album_info, req.files['album_image'][0].location];

                sql_musician = 'insert into musician (musician_name) values(?)';
                insert_musicain = [req.body.musician_name];

                sql_group = 'insert into group (group_name) values(?)';
                insert_group = [req.body.group_name];

                // sql_lyricist = 'insert into musician (musician_name) values(?)';
                // insert_lyricist = [req.body.lyricist];
                // sql_lyricist_role = 'insert into role (role) values("작사")';
                //
                // sql_composer = 'insert into musician (musician_name) values(?)';
                // insert_composer = [req.body.composer];
                // sql_composer_role = 'insert into role (role) values("작곡")';


            }
            console.log('file안갓니');
            connection.query(sql_music, insert_music, function(error, rows){
              if(error){
                console.log("Connetion Error " + error);
                res.sendStatus(500);
                connection.release();
              }
              else{
                res.status(201).send({result:'1'});
                connection.release();
              }
            })
        }
    });
});

module.exports = router;
