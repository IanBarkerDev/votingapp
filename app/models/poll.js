var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var pollSchema = new Schema({
    username: String,
    question: String,
    choices: [{
        name: String, 
        votes: Number
    }],
    totalVotes: Number,
    isVisible: Boolean
})

var Poll = mongoose.model("Poll", pollSchema);

module.exports = Poll;