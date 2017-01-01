var express = require('express');
var router = express.Router();
var async = require('async');
var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');
var mysql = require('mysql');
var db_config = require('../config/db_config.json');
aws.config.loadFromPath('./config/aws_config.json');

var s3 = new aws.S3();
const ROLE_SINGER = 1;
const ROLE_COMPOSER = 2;
const ROLE_LYRICiST = 3;
const ROLE_FEATURING = 4;
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'sopt-yuuuunmi',
        acl: 'public-read',
        key: function(req, file, cb) {
            cb(null, 'MusicMinning/' + Date.now() + '.' + file.originalname.split('.').pop());
        }
    })
});

var pool = mysql.createPool(db_config);

var uploadConts = upload.fields([{
    name: 'highlight_video',
}, {
    name: 'music',
}, {
    name: 'thumbnail',
}, {
    name: 'album_image',
}]);


router.route('/')
    .get(uploadingPage)
    .post(uploadConts, uploading);



function uploadingPage(req, res) {
    // uploading Page
    res.render('uploadss');
}



function uploading(req, res) {
    // uploading
    pool.getConnection(function(error, connection) {

        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            var isAlbum, isMusician, isLyricist, isComposer, isfeaturing;
            var album_id, music_id = 0,
                musician_id = 0,
                lyricist_id = 0,
                composer_id = 0,
                featuring_id = 0;

            console.log("호스팅완료");
            async.series([
                    function(callback) {

                        // 앨범
                        // TODO : album_info 빠져있다
                        console.log("앨범탐색");
                        // 앨범 탐색
                        connection.query('select album_id from album where album_name = ?', [req.body.album_name],
                            function(err, rows) {
                                if (err) {
                                    //connection.release();
                                    callback(err);
                                    //connection.release();

                                } else {
                                    console.log("앨범탐색 쿼리날렸음");

                                    if (rows.length === 0)
                                        isAlbum = 0;
                                    else {
                                        isAlbum = 1;
                                        album_id = rows[0].album_id;
                                    }
                                    callback(null, rows);
                                    //connection.release();
                                }
                            });
                    },
                    function(callback) {
                        // 앨범이 삽입

                        if (isAlbum === 0) {
                            console.log("앨범삽입");
                            var sql_album = 'insert into album (album_name, sale_date, album_image_url) values(?,?,?)';
                            var insert_album = [req.body.album_name, req.body.sale_date, req.files['album_image'][0].location];

                            connection.query(sql_album, insert_album, function(err, rows) {
                                if (err) {
                                    callback(err);
                                    //    connection.release();
                                } else {
                                    console.log("호하호하");
                                    callback(null, rows);
                                    //  connection.release();
                                }
                            });


                        } else {
                            callback(null, 0);
                        }

                    },
                    function(callback) {
                        // 앨범
                        if (isAlbum === 0) {
                            console.log("앨범 삽입 후 album_id받아오기");
                            connection.query('select album_id from album where album_name = ?', [req.body.album_name],
                                function(err, rows) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log("album_id받아오는중");

                                        if (rows.length === 0) {
                                            console.log("앨범 검색이 안돼요!");
                                            callback(err);
                                        } else {
                                            isAlbum = 1;
                                            album_id = rows[0].album_id;
                                            console.log("album_id = " + album_id);
                                            callback(null, rows);
                                        }
                                    }
                                });
                        } else {
                            callback(null, 0);
                        }
                    },
                    function(callback) {
                        // 음악

                        // TODO 음악 검색도 할 일이 많다...
                        console.log("음악 중복 검색");
                        connection.query('select music_id from music where title = ?', [req.body.title],
                            function(err, rows) {
                                if (err) {
                                    callback(err);
                                } else {
                                    console.log("음악중복 검색중");

                                    if (rows.length === 0) {
                                        callback(null, rows);
                                        //  connection.release();
                                    } else {
                                        callback(err);
                                        //    connection.release();
                                    }

                                }
                            });
                    },
                    function(callback) {
                        // 음악을 삽입

                        console.log("음악 삽입");
                        var sql_music = 'insert into music (album_id, title, lyrics, highlight_video_url, genre, music_url, thumbnail_url) values(?,?,?,?,?,?,?)';
                        var insert_music = [album_id, req.body.title, req.body.lyrics, req.files['highlight_video'][0].location, req.body.genre, req.files['music'][0].location, req.files['thumbnail'][0].location];
                        connection.query(sql_music, insert_music, function(err, rows) {
                            if (err) {
                                callback(err);
                            } else {
                                console.log("호하호하");
                                callback(null, rows);
                                //  connection.release();
                            }
                        });

                    },
                    function(callback) {
                        // 음악 music_id 받아오기

                        console.log("music_id 받아오기");
                        connection.query('select music_id from music where title = ?', [req.body.title],
                            function(err, rows) {
                                if (err) {
                                    callback(err);
                                } else {
                                    console.log("음악중복 검색중");

                                    if (rows.length === 0) {
                                        console.log("음악검색이 안돼요!");
                                        callback(err);
                                    } else {
                                        music_id = rows[0].music_id;
                                        console.log("music_id = " + music_id);
                                        callback(null, rows);
                                    }

                                    //    connection.release();
                                }
                            });
                    },
                    function(callback) {
                        // 가수

                        console.log("가수 검색");
                        connection.query('select musician_id from musician where musician_name = ?', [req.body.musician_name],
                            function(err, rows) {
                                if (err) {
                                    callback(err);
                                } else {
                                    console.log("가수중복 검색중");

                                    if (rows.length === 0) {
                                        isMusician = 0;

                                    } else {
                                        isMusician = 1;
                                        musician_id = rows[0].musician_id;
                                        console.log('musician_id = ' + musician_id);
                                    }

                                    callback(null, rows);
                                }
                            });
                    },
                    function(callback) {
                        // 가수 삽입

                        if (isMusician === 0) {
                            console.log("가수삽입");
                            var sql_musician = 'insert into musician (musician_name) values(?)';
                            var insert_musician = [req.body.musician_name];

                            connection.query(sql_musician, insert_musician, function(err, rows) {
                                if (err) {
                                    callback(err);
                                    //    connection.release();
                                } else {
                                    console.log("가수삽입했습니다");
                                    callback(null, rows);
                                    //  connection.release();
                                }
                            });

                        } else {
                            callback(null, 0);
                        }

                    },
                    function(callback) {
                        // 가수
                        if (isMusician === 0) {
                            console.log("가수 삽입 후 musician_id받아오기");
                            connection.query('select musician_id from musician where musician_name = ?', [req.body.musician_name],
                                function(err, rows) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log("musician_id받아오는중");

                                        if (rows.length === 0) {
                                            console.log("가수검색이 안돼요!");
                                            callback(err);
                                        } else {
                                            isMusician = 1;
                                            musician_id = rows[0].musician_id;
                                            console.log("musician_id = " + musician_id);
                                            callback(null, rows);
                                        }
                                    }
                                });
                        } else {
                            callback(null, 0);
                        }
                    },
                    function(callback) {
                        // 그룹이 있다면
                        if (req.body.group_name) {
                            console.log("그룹등록");
                            var sql_group = 'insert into group_musician (group_name, musician_id) values(?,?)';
                            var insert_group = [req.body.group_name, musician_id];

                            connection.query(sql_group, insert_group, function(err, rows) {
                                if (err) {
                                    callback(err);
                                    //    connection.release();
                                } else {
                                    console.log("그룹 등록 완료");
                                    callback(null, rows);
                                    //  connection.release();
                                }
                            });
                        } else {
                            callback(null, 0);
                        }
                    },
                    function(callback) {
                        ///피처링
                        if (req.body.featuring_name) {
                            console.log("피처링 검색");
                            connection.query('select musician_id from musician where musician_name = ?', [req.body.featuring_name],
                                function(err, rows) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log("피처링 중복 검색중");

                                        if (rows.length === 0)
                                            isfeaturing = 0;

                                        else
                                            isfeaturing = 1;
                                        callback(null, rows);
                                    }
                                });
                        } else {
                            callback(null, 0);
                        }
                    },
                    function(callback) {
                        // 피처링 가수 삽입

                        if (isfeaturing === 0) {
                            console.log("피처링가수 삽입");
                            var sql_musician = 'insert into musician (musician_name) values(?)';
                            var insert_musician = [req.body.featuring_name];

                            connection.query(sql_musician, insert_musician, function(err, rows) {
                                if (err) {
                                    callback(err);
                                    //    connection.release();
                                } else {
                                    console.log("피처링 삽입했습니다");
                                    callback(null, rows);
                                    //  connection.release();
                                }
                            });

                        } else {
                            callback(null, 0);
                        }

                    },
                    function(callback) {
                        // 피처링
                        if (req.body.featuring_name) {
                            console.log("피처링 삽입 후 musician_id받아오기");
                            connection.query('select musician_id from musician where musician_name = ?', [req.body.featuring_name],
                                function(err, rows) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log("musician_id받아오는중");

                                        if (rows.length === 0) {
                                            console.log("피처링 검색이 안돼요!");
                                            callback(err);
                                        } else {
                                            isfeaturing = 1;
                                            featuring_id = rows[0].musician_id;
                                            console.log('featuring_id = ' + featuring_id);
                                            callback(null, rows);
                                        }
                                    }
                                });
                        } else {
                            callback(null, 0);
                        }
                    },
                    function(callback) {
                        //////////////작사가
                        if (req.body.lyricist) {
                            console.log("작사가 검색");
                            connection.query('select musician_id from musician where musician_name = ?', [req.body.lyricist],
                                function(err, rows) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log("작사가 중복 검색중");

                                        if (rows.length === 0) {
                                            isLyricist = 0;

                                        } else {
                                            isLyricist = 1;
                                            lyricist_id = rows[0].musician_id;
                                            console.log('musician_id = ' + lyricist_id);
                                        }

                                        callback(null, rows);
                                    }
                                });
                        } else {
                            callback(null, 0);
                        }
                    },
                    function(callback) {
                        // 작사가 삽입

                        if (isLyricist === 0) {
                            console.log("작사가삽입");
                            var sql_musician = 'insert into musician (musician_name) values(?)';
                            var insert_musician = [req.body.lyricist];

                            connection.query(sql_musician, insert_musician, function(err, rows) {
                                if (err) {
                                    callback(err);
                                    //    connection.release();
                                } else {
                                    console.log("작사가 삽입했습니다");
                                    callback(null, rows);
                                    //  connection.release();
                                }
                            });

                        } else {
                            callback(null, 0);
                        }

                    },
                    function(callback) {
                        // 작사가
                        if (req.body.lyricist === 0) {
                            console.log("작사가 삽입 후 musician_id받아오기");
                            connection.query('select musician_id from musician where musician_name = ?', [req.body.lyricist],
                                function(err, rows) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log("musician_id받아오는중");

                                        if (rows.length === 0) {
                                            console.log("작사가검색이 안돼요!");
                                            callback(err);
                                        } else {
                                            isLyricist = 1;
                                            lyricist_id = rows[0].musician_id;
                                            console.log("lyricist_id = " + lyricist_id);
                                            callback(null, rows);
                                        }
                                    }
                                });
                        } else {
                            callback(null, 0);
                        }
                    },
                    function(callback) {
                        //////////////작곡가
                        if (req.body.composer) {
                            console.log("작곡가 검색");
                            connection.query('select musician_id from musician where musician_name = ?', [req.body.composer],
                                function(err, rows) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log("작곡가 중복 검색중");

                                        if (rows.length === 0) {
                                            isComposer = 0;

                                        } else {
                                            isComposer = 1;
                                            composer_id = rows[0].musician_id;
                                            console.log('composer_id = ' + composer_id);
                                        }

                                        callback(null, rows);
                                    }
                                });
                        } else {
                            callback(null, 0);
                        }
                    },
                    function(callback) {
                        // 작곡가 삽입

                        if (isComposer === 0) {
                            console.log("작곡가삽입");
                            var sql_musician = 'insert into musician (musician_name) values(?)';
                            var insert_musician = [req.body.composer];

                            connection.query(sql_musician, insert_musician, function(err, rows) {
                                if (err) {
                                    callback(err);
                                    //    connection.release();
                                } else {
                                    console.log("작곡가 삽입했습니다");
                                    callback(null, rows);
                                    //  connection.release();
                                }
                            });

                        } else {
                            callback(null, 0);
                        }

                    },
                    function(callback) {
                        // 작곡가
                        if (req.body.composer) {
                            console.log("작곡가 삽입 후 composer_id받아오기");
                            connection.query('select musician_id from musician where musician_name = ?', [req.body.composer],
                                function(err, rows) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log("composer_id받아오는중");

                                        if (rows.length === 0) {
                                            console.log("작곡가 검색이 안돼요!");
                                            callback(err);
                                        } else {
                                            isComposer = 1;
                                            composer_id = rows[0].musician_id;
                                            console.log("composer_id = " + composer_id);
                                            callback(null, rows);
                                        }
                                    }
                                });
                        } else {
                            callback(null, 0);
                        }
                    },
                    function(callback) {
                        // 음악 & 가수 연결

                        console.log("음악 & 가수 연결");
                        var sql_link = 'insert into role (role_num,music_id,musician_id) values(?,?,?)';
                        var insert_link = [ROLE_SINGER, music_id, musician_id];

                        connection.query(sql_link, insert_link, function(err, rows) {
                            if (err) {
                                callback(err);
                                //    connection.release();
                            } else {
                                console.log("음악 & 가수 연결 완료");
                                callback(null, rows);
                                //  connection.release();
                            }
                        });
                    },
                    function(callback) {
                        // 음악 & 작곡가 연결
                        console.log("음악 & 작곡가 연결");

                        var sql_link;
                        var insert_link;

                        if (composer_id !== 0) {
                            sql_link = 'insert into role (role_num,music_id,musician_id) values(?,?,?)';
                            insert_link = [ROLE_COMPOSER, music_id, composer_id];
                        } else {
                            sql_link = 'insert into role (role_num,music_id) values(?,?)';
                            insert_link = [ROLE_COMPOSER, music_id];
                        }

                        connection.query(sql_link, insert_link, function(err, rows) {
                            if (err) {
                                callback(err);
                                //    connection.release();
                            } else {
                                console.log("음악 & 작곡가 연결 완료");
                                callback(null, rows);
                                //  connection.release();
                            }
                        });


                    },
                    function(callback) {
                        // 음악 & 작사가 연결
                        console.log("음악 & 작사가 연결");
                        var sql_link;
                        var insert_link;

                        if (lyricist_id !== 0) {

                            sql_link = 'insert into role (role_num,music_id,musician_id) values(?,?,?)';
                            insert_link = [ROLE_LYRICiST, music_id, lyricist_id];


                        } else {
                            sql_link = 'insert into role (role_num,music_id) values(?,?)';
                            insert_link = [ROLE_LYRICiST, music_id];

                        }
                        connection.query(sql_link, insert_link, function(err, rows) {
                            if (err) {
                                callback(err);
                                //    connection.release();
                            } else {
                                console.log("음악 & 작사가 연결 완료");
                                callback(null, rows);
                                //  connection.release();
                            }
                        });
                    },
                    function(callback) {
                        // 음악 & 피처링 연결
                        console.log("음악 & 피처링 연결");
                        var sql_link;
                        var insert_link;

                        if (featuring_id !== 0) {


                            sql_link = 'insert into role (role_num, music_id, musician_id) values(?,?,?)';
                            insert_link = [ROLE_FEATURING, music_id, featuring_id];
                        } else {
                            sql_link = 'insert into role (role_num, music_id) values(?,?)';
                            insert_link = [ROLE_FEATURING, music_id];
                        }

                        connection.query(sql_link, insert_link, function(err, rows) {
                            if (err) {
                                callback(err);
                                //    connection.release();
                            } else {
                                console.log("음악 & 피처링 연결 완료");
                                callback(null, rows);
                                //  connection.release();
                            }
                        });
                    }
                ],
                function(err, result) {
                    console.log("결과까지왔써");
                    if (err) res.status(500).send(err);
                    else {
                        connection.release();
                        res.status(200).send({
                            result: 'create'

                        });
                    }
                });
        }
    });



}

module.exports = router;
