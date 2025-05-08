var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Interestpoint = new Schema({
    value: String,
    isActive: { type: Boolean, default: true } // Champ pour indiquer si le point d'intérêt est activé (true) ou non (false)
});

module.exports = mongoose.model('interestpoint', Interestpoint);
