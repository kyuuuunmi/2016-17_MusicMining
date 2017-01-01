const express = require('express');
const router = express.Router();
var async = require('async');
var mysql = require('mysql');
var db_config = require('../config/db_config')

var pool = mysql.createPool(db_config);

const ROLE_SINGER = 1;
const ROLE_COMPOSER = 2;
const ROLE_LYRICiST = 3;
const ROLE_FEATURING = 4;


router.route('/')
    .get(home)

function home(req, res) {
    pool.getConnection(function(err, connection) {
            if (err) {
                console.log("getConnection Error" + err);
                res.sendStatus(0, null);
            } else {
                var query = 'select m.music_id, m.album_id, m.title, m.highlight_video_url, m.thumbnail_url, a.album_name, a.album_image_url, mu.musician_id, mu.musician_name from music m join album a on m.album_id = a.album_id join musician mu on m.music_id = mu.musician_id'
                connection.query(query, function(error, rows) {
                    if (error) {
                        console.log("Connection Error" + error);
                        res.sendStatus(500);
                        connection.release();
                    } else {
                        res.status(200).send({
                            result: rows
                        });
                        connection.release();
                    }
                });
            }
    });
}

module.exports = router;
