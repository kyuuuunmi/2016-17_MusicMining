const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const randomstring = require('./randomstring.js');
const querystring = require('querystring');

function EmailManager() {
    var checksum = randomstring();
    EmailManager.prototype.smtpTransporter = function() {
        return nodemailer.createTransport(smtpTransport({
            host:             'smtp.naver.com',
            secureConnection: false,
            port:             465,
            auth: {
                user:         'gusdn6867@naver.com',
                pass:         'answls4047~'
            }
        }));
    }

    EmailManager.prototype.mailOptions = function(user_id, passwd, name, gender, birth) {
        var query = querystring.stringify({
            checksum: checksum,
            user_id:  user_id,
            passwd:   passwd,
            name:     name,
            gender:   gender,
            birth:    birth
        });
        var url = 'http://localhost:3000/login?' + query;
        return {
            from:     '혀누 <gusdn6867@naver.com>',
            to:       user_id,
            subject:  'MusicMining',
            text:     'MusicMining 회원가입',
            html:     '<b>🐴MusicMining🐴</b><br><a href=' + url + '>회원가입 ㄱㄱ</a>',
            checksum: checksum
        }
    }
}

module.exports = EmailManager;
