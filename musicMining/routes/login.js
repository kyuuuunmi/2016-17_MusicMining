const express = require('express');
const mysql = require('mysql');
const async = require('async');
const router = express.Router();
const db_config = require('../config/db_config.json')
const msg = require('../message.js')

/*"host" : "sopt-19th.camlg6m4m2x5.ap-northeast-2.rds.amazonaws.com",
"user" : "yuuuunmi",
"password" : "tbqkenqk^^!",*/

const pool = mysql.createPool(db_config);

// router.route('/')
//     .post(login)
//
// router.route('/regist')
//     .post(registUser)

router.route('/social')
    .post(socialLogin)

function socialLogin(req, res) {
    pool.getConnection(function(err, conn) {
        if (err) {
            res.status(500).send(msg(1, err));
            console.log('db connection err ' + err);
        } else {
            async.series([
                    function(callback) {
                        var userCheckQuery = 'select user_id from user where user_id=?';
                        var userCheckValue = [req.body.user_id];
                        conn.query(userCheckQuery, userCheckValue, function(err, rows) {
                            if (err) {
                                callback(msg(1, err));
                                console.log('userCheckQuery err: ' + err);
                            } else
                            if (rows.length <= 0) callback(null, 'not user');
                            else {
                                callback(msg(0, {}));
                                console.log('login');
                            }
                        });
                    },
                    function(callback) {
                        var registUserQuery = 'insert into user(user_id, prof_image_url, name, gender, birth) values(?, ?, ?, ?, ?)';
                        var registUserValue = [req.body.user_id, req.body.prof_image_url, req.body.name, req.body.gender, req.body.birth];
                        conn.query(registUserQuery, registUserValue, function(err, rows) {
                            if (err) {
                                callback(msg(1, err));
                                console.log('registUserQuery err: ' + err);
                            } else callback(null, 'regist user success');
                        });
                    }
                ],
                function(err, result) {
                    if (err)
                        if (err.err === 0) res.status(200).send(err)
                        else res.status(500).send(err);
                    else {
                        res.status(200).send(msg(0, {}));
                        console.log(result);
                    }
                    conn.release();
                });
        }
    });
}

module.exports = router;
