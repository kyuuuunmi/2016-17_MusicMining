var express = require('express');
var mysql = require('mysql');
var async = require('async');
var msg = require('../message.js')
var db_config = require('../config/db_config.json');
var msg = require('../message.js');
var router = express.Router();
var pool = mysql.createPool(db_config);

const ROLE_SINGER = 1;
const ROLE_COMPOSER = 2;
const ROLE_LYRICiST = 3;
const ROLE_FEATURING = 4;


router.route('/')
    .post(addMuiscPlaylist)
    .delete(deleteMuiscPlaylist)

router.route('/:user_id')
    .get(getMuiscPlaylist)

function addMuiscPlaylist(req, res) {
    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection error" + error);
            res.status(500).send(error);
        } else {
            var sql_search = 'select music_id from musicmining.play_list where user_id = ? and music_id = ?';
            async.series([

                    function(callback) {
                        // 플레이리스트에 이미 음악이 있는지 요청
                        connection.query(sql_search, [req.body.user_id, req.body.music_id], function(error, rows) {
                            if (error) {
                                callback(msg(1, error));
                                console.log(error);
                            } else {
                                if (rows.length === 0) callback(null, 'the music is not in the playlist');
                                else callback(msg(2, 'duplicate music'));
                            }
                        });
                    },
                    function(callback) {
                        // 플레이리스트에 음악이 없으면 삽입
                        connection.query('insert into play_list(user_id, music_id) values(?,?) ', [req.body.user_id, req.body.music_id], function(error, rows) {
                            if (error) {
                                callback(msg(1, error));
                                console.log(error);
                            } else {
                                callback(null, msg(0, {}));
                            }
                        });
                    }
                ],
                function(err, result) {
                    if (err)
                        if (err.err === 0) res.status(200).send(err);
                        else res.status(500).send(err);
                    else {
                        res.status(200).send(msg(0, {}));
                        connection.release();
                    }

                });



        }
    });
}

function getMuiscPlaylist(req, res) {
    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection error" + error);
            res.status(500).send(error);
        } else {

            var sql_singer = 'select m.music_id, m.title, m.music_url, a.album_image_url, p.musician_name from play_list l join music m on l.music_id = m.music_id join album a on m.album_id = a.album_id join role r on m.music_id = r.music_id join musician p on r.musician_id = p.musician_id where l.user_id = ? and r.role_num= ?';
            var sql_singer2 = 'select m.music_id, m.title, m.music_url, p.musician_name as musician_name, a.album_image_url from play_list l join music m on l.music_id = m.music_id join album a on m.album_id = a.album_id join role r on m.music_id = r.music_id join musician p on r.musician_id = p.musician_id where l.user_id = ? and r.role_num= ?'
            var sql_feat = 'select musician_name as featuring_musician_name  from role f join music m on f.music_id = m.music_id join musician fe on fe.musician_id = f.musician_id where f.music_id = ? and f.role_num = ?';
            var music_id;
            connection.query(sql_singer2, [req.params.user_id, ROLE_SINGER], function(error, rows) {
                if (error) {
                    //callback(msg(1, err));
                    res.status(500).send(error);
                    console.log(error);
                } else {
                    //music_id = rows[0].music_id;
                    res.status(200).send(msg(0, rows));
                    //callback(null, rows[0]);
                }

            });

		connection.release();
            /*
                        async.series([
                                function(callback) {
                                    // 피처링 제외한 가수 탐색
                                    connection.query(sql_singer, [req.params.user_id, ROLE_SINGER], function(error, rows) {
                                        if (error) {
                                            callback(msg(1, err));
                                            console.log(error);
                                        } else {
                                            music_id = rows[0].music_id;
                                            callback(null, rows[0]);
                                        }
                                    });
                                },
                                function(callback) {
                                    connection.query(sql_feat, [music_id, ROLE_FEATURING],
                                        function(err, rows) {
                                            if (err) {
                                                callback(msg(1, err));
                                            } else {
                                                if (rows.length === 0)
                                                    callback(null, "");
                                                else callback(null, rows[0]);


                                            }
                                        });
                                }
                            ],
                            function(err, result) {
                                if (err)
                                    if (err.err === 0) res.status(200).send(err);
                                    else res.status(500).send(err);
                                else {
                                    data = result[0];
                                    data.featuring_musician_name = result[1];
                                    res.status(200).send(msg(0, data));
                                    connection.release();
                                }

                            });
                    */
        }
    });
}

function deleteMuiscPlaylist(req, res) {
    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection error" + error);
            res.sendStatus();
        } else {
            var sql_search = 'select music_id from musicmining.play_list where user_id = ? and music_id = ?';
            async.series([
                function(callback) {
                    connection.query(sql_search, [req.body.user_id, req.body.music_id], function(error, rows) {
                        if (error) {
                            callback(msg(1, error));
                            console.log(error);
                        } else {
                            if (rows.length !== 0) callback(null, 'the music is in the playlist');
                            else callback(msg(2, 'there is no music that name'));
                        }
                    });

                },
                function(callback) {
                    connection.query('delete from play_list where user_id = ? and music_id = ?  ', [req.body.user_id, req.body.music_id], function(error, rows) {
                        if (error) {
                            console.log("Delete Error" + error);
                            res.status(500).send(error);
                        } else {
                            callback(null, msg(0, {}));
                        }
                    });
                }
            ], function(err, result) {
                if (err)
                    if (err.err === 0) res.status(200).send(err);
                    else res.status(500).send(err);
                else {
                    res.status(200).send(msg(0, {}));
                    connection.release();
                }
            });
        }
    });
}

module.exports = router;
