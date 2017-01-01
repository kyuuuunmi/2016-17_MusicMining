//like unlike~~
const express = require('express');
const router = express.Router();
var mysql = require('mysql');
var db_config = require('../config/db_config.json');

var pool = mysql.createPool(db_config);

router.route('/')
    .post(like)
    .delete(unlike)


function like(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log("getConnection Error" + err);
            res.send(err);

        } else {
            connection.query('insert into music_like (user_id, music_id) values (?,?);', [req.body.user_id, req.body.music_id], function(err, rows) {
                if (err) {
                    console.log("Connection Error" + err);

                    res.send(err);
                } else {
                    console.log("liked");
                    res.send(rows);
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
                    res.send(err);
                    connection.release();
                } else {
                    console.log("unliked");

                    res.send(rows);

                    connection.release();
                }
            });
        }
    });

}
module.exports = router;
