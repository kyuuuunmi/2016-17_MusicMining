var express = require('express');
var mysql = require('mysql');
var async = require('async');
var msg = require('../message.js');
var db_config = require('../config/db_config.json');
var msg = require('../message.js');
var router = express.Router();
var pool = mysql.createPool(db_config);

const ROLE_SINGER = 1;
const ROLE_COMPOSER = 2;
const ROLE_LYRICiST = 3;
const ROLE_FEATURING = 4;

router.route('/')
    .get(getMusicAll)
    .post(addMuiscPlaylist)
    .delete(deleteMuiscPlaylist);

router.route('/:user_id')
    .get(getMuiscPlaylist);


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
                        if (err.err === 2) res.status(200).send(err);
                        else res.status(500).send(err);
                    else
                        res.status(200).send(msg(0, {}));

                    connection.release();

                });
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
                else {
                    res.status(200).send(msg(0, {}));
                }
                connection.release();
            });
        }
    });
}
/* faster
function getMuiscPlaylist(req, res) {
    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection error" + error);
            res.status(500).send(error);
        } else {

            var sql_singer2 = 'select m.music_id, m.title, m.music_url, p.musician_name as musician_name, a.album_image_url from play_list l join music m on l.music_id = m.music_id join album a on m.album_id = a.album_id join role r on m.music_id = r.music_id join musician p on r.musician_id = p.musician_id where l.user_id = ? and r.role_num= ?';
            connection.query(sql_singer2, [req.params.user_id, ROLE_SINGER], function(error, rows) {
                if (error) {
                    res.status(500).send(error);
                    console.log(error);
                } else {
                    res.status(200).send(msg(0, rows));
                }
            });
            connection.release();

        }
    });
} */

function getMusicAll(req, res) {
    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection error" + error);
            res.status(500).send(error);
        } else {
            var sql_allMusic = 'select m.music_id, m.title, m.music_url, p.musician_name as musician_name, a.album_image_url from music m join album a on m.album_id = a.album_id join role r on m.music_id = r.music_id join musician p on r.musician_id = p.musician_id where r.role_num= ?';
            connection.query(sql_allMusic, [ROLE_SINGER], function(error, rows) {
                if (error) {
                    res.status(500).send(error);
                    console.log(error);
                } else {
                    res.status(200).send(msg(0, rows));
                }
            });
            connection.release();

        }
    });
}
/* heonu
 */

function getMuiscPlaylist(req, res) {

    var queryGetMusics = 'select m.music_id, m.title, m.music_url, a.album_image_url from play_list p join music m join album a on m.music_id=p.music_id and m.album_id=a.album_id where user_id=?';
    var queryGetRoles = 'select r.role_num, mu.musician_name from role r join musician mu on r.musician_id =mu.musician_id where r.role_num=? or r.role_num=? and r.music_id=?';
    var queryGetLikes = 'select like_id from music_like where music_id = ? and user_id = ?';
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log("getConnection Error" + err);
            res.sendStatus(0, null);
        } else {

            async.waterfall([
                function(callback) {
                    connection.query(queryGetMusics, [req.params.user_id], function(err, rows) {
                        if (err) {
                            console.log("Connection Error" + err);
                            callback(err);
                        } else {
                            callback(null, rows);
                        }
                    })
                },
                function(args, callback) {
                    var i = 0;
                    var list = [];
                    async.every(args, function(arg, done) {

                        async.series([
                            function(callseries) {
                                connection.query(queryGetRoles, [ROLE_FEATURING, ROLE_SINGER, arg.music_id], function(err, rows) {
                                    if (err) {
                                        callseries(err);
                                        console.log(err);
                                    } else {

                                        if (rows.length > 1) {
                                            rows.featuring_musician_name = rows[0].musician_name;
                                            rows.musician_name = rows[1].musicain_name;
                                        } else {
                                            rows.featuring_musician_name = '';
                                            rows.musician_name = rows[0].musician_name;
                                        }



                                        callseries(null, rows);
                                    }
                                });
                            },
                            function(callseries) {
                                connection.query(queryGetLikes, [arg.music_id, req.params.user_id], function(err, rows) {
                                    if (err) {
                                        callseries(err);
                                        console.log(err);
                                    } else {
                                        callseries(null, rows);
                                    }
                                });
                            }
                        ], function(err, result) {
                            if (err) {
                                done(err);
                                console.log(err);
                            } else {
                                arg.musician_name = result[0].musician_name;
                                arg.featuring_musician_name = result[0].featuring_musician_name;
                                arg.like = result[1].length;

                                list[i++] = arg;
                                done(null, true);
                            }
                        });

                    }, function(err, result) {
                        if (err) callback(err);
                        else callback(null, list);
                    });
                }
            ], function(err, result) {
                if (err) res.status(500).send(err);
                else res.status(200).send({
                    err: 0,
                    data: result
                });
                connection.release();
            });
        }
    });

}

module.exports = router;
/*
var sql_feat = 'select musician_name as featuring_musician_name  from role f join music m on f.music_id = m.music_id join musician fe on fe.musician_id = f.musician_id where f.music_id = ? and f.role_num = ?';
var sql_singer = 'select m.music_id, m.title, m.music_url, a.album_image_url, p.musician_name from play_list l join music m on l.music_id = m.music_id join album a on m.album_id = a.album_id join role r on m.music_id = r.music_id join musician p on r.musician_id = p.musician_id where l.user_id = ? and r.role_num= ?';
*/
