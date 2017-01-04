const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const querystring = require('querystring');

function EmailManager() {
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

    EmailManager.prototype.mailOptions = function(user_id, user_pw) {
        return {
            from:     '혀누 <gusdn6867@naver.com>',
            to:       user_id,
            subject:  'MusicMining',
            text:     'MusicMining 비밀번호 찾기',
            html:     '<b>🐴MusicMining🐴</b><br> ' + user_id + '님의 비밀번호는 ' + user_pw + '입니다 </a>'
        }
    }
}

module.exports = EmailManager;
