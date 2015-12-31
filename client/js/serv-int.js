var currentChoices = [];
var choiceNumber = 0;



function newPoll(username) {
    
    $.ajax({
        url: "/" + username + "/add",
        type: "post",
        
        dataType: "json",
        data: {
            question: $("#new-poll-question").val(),
            choices: currentChoices
        },
        
        complete: function() {
            console.log("new poll added");
        }
    })
    
    
    choiceNumber = 0;
    currentChoices = [];
    $(".new-poll-choices-append").empty();
}


// takes a poll and deletes it both from the database
// and from the users list of polls
function deletePoll(username, poll_id) {
    $.ajax({
        url: "/" + username + "/delete/" + poll_id,
        type: "get",
        
        complete: function() {
            console.log("poll " + poll_id + " deleted");
        }
    })
}

// takes a poll_id and gets the information on it to populate the edit poll form
function editPollFormPopulate(poll_id) {
    $.ajax({
        url: "/poll/" + poll_id + "/info",
        type: "get",
        
        complete: function(data) {
            data = data.responseJSON;
            $("#edit-poll-question").val(data.question);
            $(".edit-poll form").attr("data-poll_id", poll_id);
            
            // choices
            currentChoices = [];
            choiceNumber = 0;
            $(".edit-poll-choices-append").empty();
            
            $.each(data.choices, function(ind, val) {
                currentChoices.push(val);
                var html = '<button class="choice-appended" data-choice-number="' + choiceNumber + '">' + val.name + '</button>';
                choiceNumber++;
                $(".edit-poll-choices-append").append(html);
            })
        }
    })
}


function editPoll(username, poll_id) {
    $.ajax({
        url: "/" + username + "/edit/ + poll_id",
        type: "post",
        
        dataType: "json",
        data: {
            question: $("#edit-poll-question").val(),
            choices: currentChoices,
            isVisible: false
        },
        
        complete: function(data) {
            
        }
    })
}

// takes a poll and sets isVisible to true 
// (and thus can be viewed by anyone not just 
// the user logged in)
function sharePoll(username, poll_id) {
    $.ajax({
        url: "/" + username + "/share/" + poll_id,
        type: "get",
        
        complete: function() {
            console.log("poll " + poll_id + " shared");
        }
    })
}

function hidePoll(username, poll_id) {
    $.ajax({
        url: "/" + username + "/unshare/" + poll_id,
        type: "get",
        
        complete: function() {
            console.log("poll " + poll_id + " hidden");
        }
    })
}

function voteFor(poll_id, name) {
    $.ajax({
        url: "/poll/" + poll_id + "/vote/" + name,
        type: "get",
        
        complete: function() {
            getResults(poll_id);
        }
    })
}

function getResults(poll_id) {
    $.ajax({
        url: "/poll/" + poll_id + "/results",
        type: "get",
        
        complete: function(data) {
            data = data.responseJSON;
            
            var totalVotes = data.totalVotes;
            var choices = data.choices;
            
            displayResults(totalVotes, choices);
        }
    })
}

function displayResults(totalVotes, choices) {
    var $results = $(".results-list-form");
    $results.empty();
    $.each(choices, function(ind, val) {
        var para = val.name + ": " + val.votes / totalVotes;
        
        var html = "<p>" + para + "</p>";
        $results.append(html);
    })
}