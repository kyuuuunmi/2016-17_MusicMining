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
        var url = 'http://52.78.156.235:3000/login?' + query;
        return {
            from:     'MusicMining <gusdn6867@naver.com>',
            to:       user_id,
            subject:  'MusicMining 회원가입',
            text:     'MusicMining 회원가입',
            html:     'MusicMining<br><br><br><a href=' + url + '>Music Mining 회원가입을 위해 이 링크를 클릭해 주세요.</a>',
            checksum: checksum
        }
    }
}

module.exports = EmailManager;
