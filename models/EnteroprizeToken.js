const mongoose = require('mongoose');

const enteroprizeTokenSchema = new mongoose.Schema({
    type: String,
    username: String,
    application_name: String,
    client_id: String,
    token_type: String,
    access_token: String,
    expires_in: Number,
    state: String,
    scope: String,
    guest_office_id: String,
    created:String
});

const EnteroprizeToken = mongoose.model('EnteroprizeToken', enteroprizeTokenSchema, 'enteroprize_tokens');

module.exports = EnteroprizeToken;
