var mongoose = require('mongoose');
 
module.exports = mongoose.model('User',
{
    userid:String,
    username: String,
    displayName: String,
    accessToken: String,
    title:String,
    term_count:String,
    url:String
});