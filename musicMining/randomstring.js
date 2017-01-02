module.exports = function() {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var length = 15;
    var randomString = '';
    for(var i = 0; i < length; i++) {
        randomIndex = Math.floor(Math.random() * chars.length);
        randomString += chars.substring(randomIndex, randomIndex + 1);
    }
    console.log('randomString: ' + randomString);
    return randomString;
}
