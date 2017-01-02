//like unlike~~
const express = require('express');
const router = express.Router();
var mysql = require('mysql');
var async = require('async');
var db_config = require('../config/db_config.json');
var msg = require('../message.js');

var pool = mysql.createPool(db_config);

router.route('/')
    .post(like)
    .delete(unlike)
router.route('/:music_id')
    .get(info)

function like(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log("getConnection Error" + err);
            //res.send(err);
            res.status(500).send(err)

        } else {
            connection.query('insert into music_like (user_id, music_id) values (?,?);', [req.body.user_id, req.body.music_id], function(err, rows) {
                if (err) {
                    console.log("Connection Error" + err);
                    res.status(500).send(err);
                    //res.send(err);
                } else {
                    console.log("liked");
                    res.status(200).send(msg(0, {}));
                    //res.send(rows);
                }

                connection.release();
            });
        }
    });


}

function unlike(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log("getConnection Error" + err);
            res.send(err);

        } else {
            connection.query('delete from music_like where user_id= ? and music_id=?;', [req.body.user_id, req.body.music_id], function(err, rows) {
                if (err) {
                    console.log("Connection Error" + err);
                    //res.send(err);
                    res.status(500).send(err)
                    connection.release();
                } else {
                    console.log("unliked");
                    res.status(200).send(msg(0, {}));
                    //res.send(rows);

                    connection.release();
                }
            });
        }
    });
}


function info(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log("getConnection Error" + err);
            res.send(err);

        } else {
            var musicid = req.params.music_id;
            sql1 = 'select  m.music_id, m.title, m.lyrics,  m.genre, a.album_id, a.album_name, a.album_info, a.album_image_url, a.sale_date,  m.music_url from album a join music m on a.album_id=m.album_id where m.music_id=?;'
            sql2 = 'select count(*) as likes from music_like where music_id=?;'
            sql3 = 'select r.role_num, r.musician_id, m.musician_name from role r join musician m on r.musician_id=m.musician_id where r.music_id=?'

            async.parallel([
                    function(callback) {
                        connection.query(sql1, [musicid],
                            function(err, rows) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, rows[0]);
                                }
                            });
                    },
                    function(callback) {
                        connection.query(sql2, [musicid],
                            function(err, rows) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, rows);

                                }
                            });
                    },

                    function(callback) {
                        connection.query(sql3, [musicid],
                            function(err, rows) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, rows);

                                }
                            });
                    }


                ],
                function(err, result) {
                    if (err) {
                      connection.release();
                      res.send(err);
                    }
                    else {
                        data = result[0];
                        data.likes = result[1][0].likes;
                        data.composer = result[2];
                        res.status(200).send(msg(0, data));
                        connection.release();
                    }
                }
              );
        }
    });
}

module.exports = router;
