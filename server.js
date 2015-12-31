var express = require("express");
var mongoose = require("mongoose");
var bodyparser = require("body-parser");
var path = require("path");

mongoose.connect("mongodb://localhost/votingapp");

var User = require("./app/models/user.js");
var Poll = require("./app/models/poll.js");

var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
//app.use(express.cookieParser());
app.use(express.static(path.resolve(__dirname, 'client'), {redirect: false}));

app.set("views", "./views");
app.set("view engine", "jade");

app.get("/", function(req, res) {
  res.render("index");
})

// login
app.post("/login", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  
  User.findOne({
      username: username
  }, function(err, doc) {
      if(err) throw err;
      if(doc.password === password) {
          res.redirect("/" + username);
      } else {
          //TODO: login unsuccessful
      }
  })
})

// sign up
app.post("/signup", function(req, res) {
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var con_password = req.body.con_password;
  
  //TODO: passwords and con_password not equal
  
  var user = new User({
      username: username,
      password: password,
      email: email,
      polls: [],
      isVisible: true
  })
  
  user.save();
  res.redirect("/" + username);
})

// profile page (unique username)
app.get("/:username", function(req, res) {
  var username = req.params.username;
  
  User.findOne({
      username: username
  }, function(err, doc) {
      if(err) throw err;
      Poll.find({
        poll_id: {
          $in: doc.polls
        }
      }, function(err, polls) {
        if(err) throw err;
        res.render("profile", {
          username: doc.username,
          polls: polls,
          isVisible: doc.isVisible
        })
      })
  })
})

// poll page (unique poll_id)
app.get("/poll/:poll_id", function(req, res) {
  var poll_id = req.params.poll_id;
  
  Poll.findOne({
      poll_id: poll_id
  }, function(err, doc) {
      if(err) throw err;
      res.render("poll_page", {
          poll_id: doc.poll_id,
          username: doc.username,
          question: doc.question,
          choices: doc.choices,
          totalVotes: doc.totalVotes,
          isVisible: doc.isVisible
      })
  })
})

// add a new poll
/* 
* need question
* num_choices
* choices in an array
*/
app.post("/:username/add", function(req, res) {
  var username = req.params.username;
  
  var poll_id = Math.floor(Math.random() * 1000);
  var question = req.body.question;
  var choices = req.body.choices;
  
  var totalVotes = 0;
  var isVisible = false;
  
  var poll = new Poll({
      poll_id: poll_id,
      username: username,
      question: question,
      choices: choices,
      totalVotes: totalVotes,
      isVisible: isVisible
  })
  
  poll.save();
  
  User.update({
      username: username
  }, {
      $push: {
          polls: poll.poll_id
      }
  }, function(err, doc) {
      if(err) throw err;
  })
  
  
})

// get information on a poll
app.get("/poll/:poll_id/info", function(req, res) {
  var poll_id = req.params.poll_id;
  
  Poll.findOne({
    poll_id: poll_id
  }, function(err, doc) {
      if(err) throw err;
      res.json(doc);
  })
})

// update an existing poll
app.post("/:username/edit/:poll_id", function(req, res) {
  var username = req.params.username;
  var poll_id = req.params.poll_id;
  
  var question = req.body.question;
  var choices = req.body.choices;
  
  var totalVotes = 0
  var isVisible = req.body.isVisible;
  
  Poll.update({
      poll_id: poll_id
  }, {
      $set: {
        question: question,
        choices: choices,
        totalVotes: totalVotes,
        isVisible: isVisible
      }
  }, function(err, doc) {
    if(err) throw err;
  })
})

// delete a poll
app.get("/:username/delete/:poll_id", function(req, res) {
  var username = req.params.username;
  var poll_id = req.params.poll_id;
  
  Poll.remove({
    poll_id: poll_id
  }, function(err, doc) {
    if(err) throw err;
  })
  
  //TODO: source of failure high here
  User.update({
    username: username
  }, {
    $pull: {
      polls: poll_id
    }
  }, function(err, doc) {
    if(err) throw err;
  })
})

// share a poll
app.get("/:username/share/:poll_id", function(req, res) {
  var username = req.params.username;
  var poll_id = req.params.poll_id;
  
  Poll.update({
    poll_id: poll_id
  }, {
    $set: {
      isVisible: true
    }
  }, function(err, doc) {
    if(err) throw err;
  })
})

// UNshare a poll
app.get("/:username/unshare/:poll_id", function(req, res) {
  var username = req.params.username;
  var poll_id = req.params.poll_id;
  
  Poll.update({
    poll_id: poll_id
  }, {
    $set: {
      isVisible: false
    }
  }, function(err, doc) {
    if(err) throw err;
  })
})

// in profile results
app.get("/:username/results/:poll_id", function(req, res) {
  var username = req.params.username;
  var poll_id = req.params.poll_id;
  
  Poll.findOne({
    poll_id: poll_id
  }, function(err, doc) {
    if(err) throw err;
    
    res.json({
      choices: doc.choices,
      totalVotes: doc.totalVotes
    })
  })
})

// general results (on request or post voting)
app.get("/poll/:poll_id/results", function(req, res) {
  var username = req.params.username;
  var poll_id = req.params.poll_id;
  
  Poll.findOne({
    poll_id: poll_id
  }, function(err, doc) {
    if(err) throw err;
    
    res.json({
      choices: doc.choices,
      totalVotes: doc.totalVotes
    })
  })
})

// record vote in poll
app.get("/poll/:poll_id/vote/:choice", function(req, res) {
  var poll_id = req.params.poll_id;
  
  // choice = name
  var choice = req.params.choice;
  
  Poll.update({
    poll_id: poll_id,
  }, {
    $inc: {
      totalVotes: 1
    }
  }, function(err, doc) {
    if(err) throw err;
  })
  
  Poll.update({
    poll_id: poll_id,
    "choices.name": choice
  }, {
    $inc: {
      "choices.$.votes": 1
    }
  }, function(err, doc) {
      if(err) throw err;
  })
})

// non-author adding option
app.post("/poll/:poll_id/new", function(req, res) {
  var poll_id = req.params.poll_id;
  var name = req.body.name;
  
  // if user = logged in
  Poll.update({
    poll_id: poll_id
  }, {
    $push: {
      choices: {
        name: name,
        votes: 1
      }
    }
  }, function(err, doc) {
      if(err) throw err;
  })
})



app.listen(process.env.PORT, process.env.IP);