const express = require('express');
const mysql = require('mysql');
const async = require('async');
const router = express.Router();
const db_config = require('../config/db_config.json')
const msg = require('../message.js')
const emailManager = require('../emailmanager.js');

const pool = mysql.createPool(db_config);

var checksum;

router.route('/')
      .post(login)
      .get(receiveMail)

router.route('/regist')
      .post(regist)

function login(req, res) {
    if (req.body.case == 0) {
        userCheckQuery = 'select user_id from user where user_id=?';
        userCheckValue = [req.body.user_id];
    } else {
        userCheckQuery = 'select user_id, passwd from user where user_id=? and passwd=?';
        userCheckValue = [req.body.user_id, req.body.passwd];
    }
    var registSocialUserQuery = 'insert into user(user_id, prof_image_url, name, gender, birth) values(?, ?, ?, ?, ?)';
    var registSocialUserValue = [req.body.user_id, req.body.prof_image_url, req.body.name, req.body.gender, req.body.birth];
    pool.getConnection(function(err, conn) {
        if (err) {
            res.status(500).send(msg(1, {}));
            console.log('db connection err ' + err);
        } else {
            async.series([
                    function(callback) {
                        conn.query(userCheckQuery, userCheckValue, function(err, rows) {
                            if (err) {
                                callback(msg(1, {}));
                                console.log('userCheckQuery err: ' + err);
                            } else
                                if (rows.length < 1)
                                    if (req.body.case == 0) callback(null, 'not user');
                                    else {
                                        callback(msg(1, {}));
                                        console.log('id or passwd is not correct');
                                    }
                                else {
                                    callback(msg(0, {}));
                                    console.log('login');
                                }
                        });
                    },
                    function(callback) {
                        conn.query(registSocialUserQuery, registSocialUserValue, function(err, rows) {
                            if (err) {
                                callback(msg(1, {}));
                                console.log('registSocialUserQuery err: ' + err);
                            } else callback(null, 'regist social user success');
                        });
                    }
                ],
                function(err, result) {
                    if (err)
                        if (err.err == 0) res.status(200).send(err)
                        else              res.status(500).send(err);
                    else {
                        res.status(200).send(msg(0, {}));
                        console.log(result);
                    }
                    conn.release();
                });
        }
    });
}

function regist(req, res) {
    var userCheckQuery2 = 'select user_id from user where user_id = ?';
    var userCheckValue2 = [req.body.user_id];
    var eManager = new emailManager();
    var smtpTransporter = eManager.smtpTransporter();
    var mailOptions = eManager.mailOptions(req.body.user_id, req.body.passwd, req.body.name, req.body.gender, req.body.birth);
    checksum = mailOptions.checksum;
    pool.getConnection(function(err, conn) {
        if(err) {
            res.status(500).send(msg(1, {}));
            console.log('db connection err: ' + err);
        } else {
            async.series([
                    function(callback){
                        conn.query(userCheckQuery2, userCheckValue2, function(err, rows) {
                            if(err) {
                                callback(msg(1, {}));
                                console.log('userCheckQuery2 err: ' + err);
                            } else
                                if(rows.length < 1) callback(null, 'not user');
                                else {
                                    callback(msg(1, {}));
                                    console.log('already user');
                                }
                        });
                    },
                    function(callback){
                        smtpTransporter.sendMail(mailOptions, function(err, info) {
                            if(err) {
                                callback(msg(1, {}));
                                console.log('sendMail err: ' + err);
                            } else callback(null, 'sendMail success');
                        });
                        smtpTransporter.close();
                    }
                ],
                function(err, result) {
                    if(err)   res.status(500).send(err)
                    else {
                        res.status(200).send(msg(0, {}));
                        console.log(result);
                    }
                    conn.release();
                });
        }
    });
}

function receiveMail(req, res) {
    var registUserQuery = 'insert into user(user_id, passwd, name, gender, birth) values(?, ?, ?, ?, ?)';
    var registUserValue = [req.query.user_id, req.query.passwd, req.query.name, req.query.gender, req.query.birth];
    console.log(registUserValue);
    pool.getConnection(function(err, conn) {
        if(err) {
            res.status(500).send('<h2>DB 연결 에러;; 미안<h2>');
            console.log('db connection err: ' + err);
        } else {
            if(req.query.checksum == checksum) {
                conn.query(registUserQuery, registUserValue, function(err, rows) {
                    if(err) res.status(500).send('<h2>DB 쿼리 에러</h2>');
                    else    res.status(200).send('<h2>회원가입 성공~!^^</h2>');
                });
            } else          res.status(500).send('<h2>회원가입 실패, 경로가 틀림</h2>');
        }
    })
}

module.exports = router;
