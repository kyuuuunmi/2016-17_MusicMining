const express = require('express');
const mysql = require('mysql');
const async = require('async');
var crypto = require('crypto');
const router = express.Router();
const db_config = require('../config/db_config.json');
const msg = require('../message.js');
const emailManager = require('../emailmanager.js');
const passwdManager = require('../passwdmanager.js');
const pool = mysql.createPool(db_config);
var key=require('../config/key.json');
var checksum;
var secret_key = key.crypto_key;


router.route('/')
    .post(login)
    .get(receiveMail)

router.route('/regist')
    .post(regist)

router.route('/findpw')
    .post(findPw)

function login(req, res) {
    if (req.body.case == 0) {
        userCheckQuery = 'select user_id from user where user_id=?';
        userCheckValue = [req.body.user_id];
    } else {
      var encryption = crypto.createCipher('aes128', secret_key);

        userCheckQuery = 'select user_id, passwd from user where user_id=? and passwd=?';
        //console.log(req.body.passwd);
        encryption.update(req.body.passwd,'base64','binary');
        var encrypted=encryption.final('binary');


        userCheckValue = [req.body.user_id, encrypted];
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
                            if (rows.length < 1) {
                                console.log("rows length" + rows.length);
                                if (req.body.case == 0) callback(null, 'not user');
                                else {
                                    callback(msg(1, {}));
                                    console.log('id or passwd is not correct');
                                }
                            } else {
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

function regist(req, res) {
    var userCheckQuery2 = 'select user_id from user where user_id = ?';
    var userCheckValue2 = [req.body.user_id];
    var eManager = new emailManager();
    var smtpTransporter = eManager.smtpTransporter();
    var mailOptions = eManager.mailOptions(req.body.user_id, req.body.passwd, req.body.name, req.body.gender, req.body.birth);
    checksum = mailOptions.checksum;
    pool.getConnection(function(err, conn) {
        if (err) {
            res.status(500).send(msg(1, {}));
            console.log('db connection err: ' + err);
        } else {
            async.series([
                    function(callback) {
                        conn.query(userCheckQuery2, userCheckValue2, function(err, rows) {
                            if (err) {
                                callback(msg(1, {}));
                                console.log('userCheckQuery2 err: ' + err);
                            } else
                            if (rows.length < 1) callback(null, 'not user');
                            else {
                                callback(msg(1, {}));
                                console.log('already user');
                            }
                        });
                    },
                    function(callback) {
                        smtpTransporter.sendMail(mailOptions, function(err, info) {
                            if (err) {
                                callback(msg(1, {}));
                                console.log('sendMail err: ' + err);
                            } else callback(null, 'sendMail success');
                        });
                        smtpTransporter.close();
                    }
                ],
                function(err, result) {
                    if (err) res.status(500).send(err)
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
    //scrypt.hash.config.outputEncoding = "hex";
    //var passwdHashed = scrypt.hashedPassword(req.query.passwd, 0.1);
    var encryption = crypto.createCipher('aes128', secret_key);
    encryption.update(req.query.passwd,'base64','binary');
    var encrypted=encryption.final('binary');
    var registUserValue = [req.query.user_id, encrypted, req.query.name, req.query.gender, req.query.birth];
    console.log(registUserValue);
    pool.getConnection(function(err, conn) {
        if (err) {
            res.status(500).send('<h2>DB 연결 에러;; 미안<h2>');
            console.log('db connection err: ' + err);
        } else {
            if (req.query.checksum == checksum) {

                conn.query(registUserQuery, registUserValue, function(err, rows) {
                    if (err) res.status(500).send('<h2>DB 쿼리 에러</h2>');
                    else res.status(200).send('<h2>회원가입 성공~!^^</h2>');
                });
            } else res.status(500).send('<h2>회원가입 실패, 경로가 틀림</h2>');
        }
    });
}

function findPw(req, res) {
    var sql_getPw = 'select passwd from user where user_id = ?';
    var val_userId = [req.body.user_id];
    var eManager = new passwdManager();
    var smtpTransporter = eManager.smtpTransporter();
    var decryption = crypto.createDecipher('aes128', secret_key);

    var mailOptions;
    pool.getConnection(function(err, conn) {
        if (err) {
            res.status(500).send(msg(1, 'Connection Error'));
            console.log('db connection err: ' + err);
        } else {
            async.series([
                function(callback) {
                    // pw받아오기
                    conn.query(sql_getPw, val_userId, function(err, rows) {
                        if (err) {
                            callback(msg(1, {}));
                            console.log('sql_getPw err : ' + err);
                        } else {
                            if (rows.length < 1) {
                                callback(msg(1, 'not user'));
                            } else {
                                decryption.update(rows[0].passwd,'binary','base64');
                                var decrypted=decryption.final('base64');
                                mailOptions = eManager.mailOptions(req.body.user_id, decrypted);
                                callback(null, 'user');
                            }
                        }
                    });
                },
                function(callback) {
                    smtpTransporter.sendMail(mailOptions, function(err, info) {
                        if (err) {
                            callback(msg(1,
                                'Connection Err'
                            ));
                            console.log('sendMail err : ' + err);
                        } else callback(null, 'sendMail success');

                    });
                    smtpTransporter.close();


                }
            ], function(err, result) {
                if (err)
                    if (err.err == 1) res.status(200).send(err);
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
