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
        
        success: function() {
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
        
        success: function() {
            window.location.pathname = "/" + username;
        }
    })
}

// takes a poll_id and gets the information on it to populate the edit poll form
function editPollFormPopulate(poll_id) {
    $.ajax({
        url: "/poll/" + poll_id + "/info",
        type: "get",
        
        success: function(data) {
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
        url: "/" + username + "/edit/" + poll_id,
        type: "post",
        
        dataType: "json",
        data: {
            question: $("#edit-poll-question").val(),
            choices: currentChoices,
            isVisible: false
        },
        
        success: function(data) {
            window.location.pathname = "/" + username;
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
        
        success: function() {
            window.location.pathname = "/" + username;
        }
    })
}

function hidePoll(username, poll_id) {
    $.ajax({
        url: "/" + username + "/unshare/" + poll_id,
        type: "get",
        
        success: function() {
            window.location.pathname = "/" + username;
        }
    })
}

function voteFor(poll_id, name) {
    $.ajax({
        url: "/poll/" + poll_id + "/vote/" + name,
        type: "get",
        
        success: function() {
            // hide all the vote options
            $(".choice-vote").css("display", "none");
            getResults(poll_id);
        }
    })
}

function getResults(poll_id) {
    $.ajax({
        url: "/poll/" + poll_id + "/results",
        type: "get",
        
        success: function(data) {
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
        var para = val.name + ": <span class='results-percentage'>" + +(val.votes / totalVotes * 100).toFixed(2) + "%</span>";
        
        var html = "<p>" + para + "</p>";
        $results.append(html);
    })
    
    googlePieChart(choices);
}

function googlePieChart(choices) {
    drawChart(choices)
    function drawChart() {
        var arr = [["Choice", "Votes"]];
        $.each(choices, function(ind, val) {
            arr.push([val.name, val.votes]);
        })
        var data = google.visualization.arrayToDataTable(arr);
        var options = {
            backgroundColor: "none",
            chartArea: {
                top: "10%",
                right: "10%",
                bottom: "10%",
                left: "10%"
            }
        };
        
        var chart = new google.visualization.PieChart(document.getElementById("chart"));
        chart.draw(data, options);
     }
}

function addAuthChoice(str, poll_id) {
    $.ajax({
        url: "/poll/" + poll_id + "/new",
        type: "post",
        dataType: "json",
        data: {
            name: str
        },
        
        success: function() {
            // add new choice to list on page (already added in database)
            var html = '<div class="choice" id="' + str + '"><p>' + str + '<button class="choice-vote">Vote</button></p></div>';
            $("#poll-choices").append(html);
            
            // hide all the vote options
            $(".choice-vote").css("display", "none");
            
            // get results
            getResults(poll_id);
        }
    })
}

function userLogout() {
    document.cookie = "logged=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.pathname = "/";
}