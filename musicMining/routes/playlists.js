var express = require('express');
var mysql = require('mysql');
var async = require('async');
var msg = require('../message.js')
var db_config = require('../config/db_config.json');

var router = express.Router();
var pool = mysql.createPool(db_config);

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
            connection.query('insert into play_list(user_id, music_id) values(?,?) ', [req.body.user_id, req.body.music_id], function(error, rows) {
                if (error) {
                    console.log("Insertion Error" + error);
                    res.status(500).send(error);
                } else {
                    res.status(200).send({
                        result: rows
                    });
                }
                connection.release();
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
          // 쿼리 한번 날려서 featuring 있는지 검색 하고 와야할듯
          //  sql = 'select m.music_id, m.title, m.music_url, a.album_image_url, p.musician_name from play_list l join music m on l.music_id = m.music_id join album a on m.album_id = a.album_id join role r on m.music_id = r.music_id join role f on f.music_id = m.music_id join musician p on r.musician_id = p.musician_id  where l.user_id = ? and r.role= ? and f.role'
            sql ='select m.music_id, m.title,  p.musician_name as singer, fe.musician_name as feat, m.music_url, a.album_image_url from play_list l join music m on l.music_id = m.music_id join album a on m.album_id = a.album_id join role r on m.music_id = r.music_id join role f on f.music_id = m.music_id join musician p on r.musician_id = p.musician_id join musician fe on fe.musician_id = f.musician_id where l.user_id = ? and r.role_num= ? and f.role_num = ? '
            connection.query(sql, [req.params.user_id, 1, 4], function(error, rows) {
                if (error) {
                    console.log(error);
                    res.status(500).send(error);
                } else {
                    console.log(rows);
                    res.status(200).send(rows);
                }
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
            connection.query('delete from play_list where user_id = ? and music_id = ?  ', [req.body.user_id, req.body.music_id], function(error, rows) {
                if (error) {
                    console.log("Delete Error" + error);
                    res.status(500).send(error);
                    connection.release();
                } else {
                    res.status(200).send(rows);
                    connection.release();
                }
            });
        }
    });
}

module.exports = router;
