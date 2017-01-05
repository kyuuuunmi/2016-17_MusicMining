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
    router.route('/')
    .get(info)

function like(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log("getConnection Error" + err);
            res.status(500).send(err);
        } else {

            var sql_search = 'select like_id from musicmining.music_like where user_id = ? and music_id = ?';
            var sql_insert = 'insert into music_like (user_id, music_id) values (?,?)';
            var sql_value = [req.body.user_id, req.body.music_id];

            async.series([
                function(callback) {
                    connection.query(sql_search, sql_value, function(err, rows) {
                        if (err) {
                            callback(msg(1, error));
                            console.log(error);
                        } else {
                            if (rows.length === 0) callback(null, 'there is no data with like');
                            else callback(msg(2, 'duplicate likes'));
                        }
                    });
                },
                function(callback) {
                    connection.query(sql_insert, sql_value, function(err, rows) {
                        if (err) {
                            callback(msg(1, err));
                            console.log("Connection Error" + err);
                        } else {
                            callback(null, msg(0, {}));
                        }

                    });
                }
            ], function(err, result) {
                if (err)
                    if (err.err === 2) res.status(200).send(err);
                    else res.status(500).send(err);
                else
                    res.status(200).send(msg(0, {}));

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

            var sql_search = 'select like_id from musicmining.music_like where user_id = ? and music_id = ?';
            var sql_delete = 'delete from music_like where user_id= ? and music_id=? ';
            var sql_value = [req.body.user_id, req.body.music_id];

            async.series([
                function(callback) {
                    connection.query(sql_search, sql_value, function(err, rows) {
                        if (err) {
                            callback(msg(1, err));
                            console.log(err);
                        } else {
                            if (rows.length !== 0) callback(null, 'the music is in');
                            else callback(msg(2, 'the music is not liked'));
                        }
                    })
                },
                function(callback) {
                    connection.query(sql_delete, sql_value, function(err, rows) {
                        if (err) {
                            console.log("Connection Error" + err);
                            callback(msg(1, error));
                        } else {
                            callback(null, msg(0, {}));
                        }
                    });
                }
            ], function(err, result) {
                if (err)
                    if (err.err === 0) res.status(200).send(err);
                    else res.status(500).send(err);
                else
                    res.status(200).send(msg(0, {}));
                connection.release();

            })


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
                    } else {
                        data = result[0];
                        data.likes = result[1][0].likes;
                        data.composers = result[2];
                        res.status(200).send(msg(0, data));
                        connection.release();
                    }
                }
            );
        }
    });
}

module.exports = router;
