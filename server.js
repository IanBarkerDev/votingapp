var express = require("express");
var mongoose = require("mongoose");
var bodyparser = require("body-parser");
var path = require("path");
var cookieParser = require("cookie-parser")

mongoose.connect("mongodb://dbadmin:slightpushmargingreat@ds039115.mongolab.com:39115/votingappdb");

var User = require("./app/models/user.js");
var Poll = require("./app/models/poll.js");

var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, 'client'), {redirect: false}));

app.set("views", "./views");
app.set("view engine", "jade");

app.get("/", function(req, res) {
  res.render("index");
});

// login
app.post("/login", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  
  User.findOne({
      username: username
  }, function(err, doc) {
      if(err) throw err;
      
      // if username doesn't exist
      if(doc === null) {
        res.redirect("/login.html?incorrect=" + encodeURIComponent("username"));
      }
      
      // if all goes well
      else if(doc.password === password) {
          res.cookie("logged", username);
          res.redirect("/user/" + username);
      
      // if password incorrect
      } else {
          res.redirect("/login.html?incorrect=" + encodeURIComponent("password"));
      }
  })
});

// sign up
app.post("/signup", function(req, res) {
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var con_password = req.body.con_password;
  
  User.findOne({
    username: username
  }, function(err, doc) {
    if(err) throw err;
    
    if(doc !== null) {
      // username already taken
      res.redirect("/signup.html?incorrect=username");
    } else if(password !== con_password) {
      // passwords don't match
      res.redirect("/signup.html?incorrect=password");
    } //TODO: if email doesn't exist; redirect back incorrect=email
  });
  
  // everything right; create user
  
  var user = new User({
      username: username,
      password: password,
      email: email,
      polls: [],
      isVisible: true
  });
  
  user.save();
  res.cookie("logged", username);
  res.redirect("/user/" + username);
});

// profile page (unique username)
app.get("/user/:username", function(req, res) {
  var username = req.params.username;
  
  User.findOne({
      username: username
  }, function(err, doc) {
      if(err) throw err;
      Poll.find({
        _id: {
          $in: doc.polls
        }
      }, function(err, polls) {
        if(err) throw err;
        res.render("profile", {
          username: doc.username,
          polls: polls,
          isVisible: doc.isVisible,
          logged: req.cookies.logged
        })
      })
  })
});

// poll page (unique poll_id)
app.get("/poll/:_id", function(req, res) {
  var _id = req.params._id;
  
  Poll.findOne({
      _id: _id
  }, function(err, doc) {
      if(err) throw err;
      res.render("poll_page", {
          _id: doc._id.toString(),
          username: doc.username,
          question: doc.question,
          choices: doc.choices,
          totalVotes: doc.totalVotes,
          isVisible: doc.isVisible,
          logged: req.cookies.logged
      })
  })
});

// add a new poll
/* 
* need question
* choices in an array
*/
app.post("/user/:username/add", function(req, res) {
  var username = req.params.username;

  var question = req.body.question;
  var choices = req.body.choices;
  
  var totalVotes = 0;
  var isVisible = false;
  
  var poll = new Poll({
      username: username,
      question: question,
      choices: choices,
      totalVotes: totalVotes,
      isVisible: isVisible
  });

  poll.save(function(err,p) {
      User.update({
          username: username
      }, {
          $push: {
              polls: p._id
          }
      }, function(err, doc) {
          if(err) throw err;
          res.end();
      })
  });
});

// get information on a poll
app.get("/poll/:_id/info", function(req, res) {
  console.log("server1");
  var _id = req.params._id;
  
  Poll.findOne({
    _id: _id
  }, function(err, doc) {
      if(err) throw err;
      res.json(doc);
  })
});

// update an existing poll
app.post("/user/:username/edit/:_id", function(req, res) {
 
  var username = req.params.username;
  var _id = req.params._id;
  
  var question = req.body.question;
  var choices = req.body.choices;
  
  // sets all votes back to 0
  for(var i = 0; i < choices.length; i ++) {
    choices[i].votes = 0;
  }
  
  var totalVotes = 0;
  var isVisible = req.body.isVisible;
  
  Poll.update({
      _id: _id
  }, {
      $set: {
        question: question,
        choices: choices,
        totalVotes: totalVotes,
        isVisible: isVisible
      }
  }, function(err, doc) {
    if(err) throw err;
    res.end();
  })
});

// delete a poll
app.get("/user/:username/delete/:_id", function(req, res) {
  var username = req.params.username;
  var _id = req.params._id;
  
  Poll.remove({
    _id: _id
  }, function(err, doc) {
    if(err) throw err;
  });
  
  User.update({
    username: username
  }, {
    $pull: {
      polls: _id
    }
  }, function(err, doc) {
    if(err) throw err;
    res.end();
  })
});

// share a poll
app.get("/user/:username/share/:id", function(req, res) {
  var username = req.params.username;
  var id = req.params.id;
  Poll.update({
    _id: id
  }, {
    $set: {
      isVisible: true
    }
  }, function(err, doc) {
    if(err) throw err;
    res.end();
  })
});

// UNshare a poll
app.get("/user/:username/unshare/:id", function(req, res) {
  var username = req.params.username;
  var id = req.params.id;
  
  Poll.update({
    _id: id
  }, {
    $set: {
      isVisible: false
    }
  }, function(err, doc) {
    if(err) throw err;
    res.end();
  })
});

// in profile results
app.get("/user/:username/results/:_id", function(req, res) {
  var username = req.params.username;
  var _id = req.params._id;
  
  Poll.findOne({
    _id: _id
  }, function(err, doc) {
    if(err) throw err;
    
    res.json({
      choices: doc.choices,
      totalVotes: doc.totalVotes
    })
  })
});

// general results (on request or post voting)
app.get("/poll/:poll_id/results", function(req, res) {
  var poll_id = req.params.poll_id;
  
  Poll.findOne({
    _id: poll_id
  }, function(err, doc) {
    if(err) throw err;
    res.json({
      choices: doc.choices,
      totalVotes: doc.totalVotes
    })
  })
});

// record vote in poll
app.get("/poll/:poll_id/vote/:choice", function(req, res) {
  var poll_id = req.params.poll_id;
  
  // choice = choice objectID
  var choice = req.params.choice;
  
  Poll.update({
    _id: poll_id
  }, {
    $inc: {
      totalVotes: 1
    }
  }, function(err, doc) {
    if(err) throw err;
  });
  
  Poll.update({
    _id: poll_id,
    "choices._id": choice
  }, {
    $inc: {
      "choices.$.votes": 1
    }
  }, function(err, doc) {
      if(err) throw err;
      res.end();
  })
});

// non-author adding option
app.post("/poll/:poll_id/new", function(req, res) {
  var poll_id = req.params.poll_id;
  var name = req.body.name;
  
  // if user = logged in
  Poll.update({
    _id: poll_id
  }, {
    $push: {
      choices: {
        name: name,
        votes: 1
      }
    }, $inc: {
      totalVotes: 1
    }
  }, function(err, doc) {
      if(err) throw err;
      res.status(200).json({status:"ok"})
  })
});



app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Running on port " + process.env.PORT);
});