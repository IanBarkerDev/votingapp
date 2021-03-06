var currentChoices = [];
var choiceNumber = 0;



function newPoll(username) {
    
    $.ajax({
        url: "/user/" + username + "/add",
        type: "post",
        
        dataType: "json",
        data: {
            question: $("#new-poll-question").val(),
            choices: currentChoices
        },
        
        complete: function() {
            window.location.pathname = "/user/" + username;
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
        url: "/user/" + username + "/delete/" + poll_id,
        type: "get",
        
        success: function() {
            window.location.pathname = "/user/" + username;
        }
    })
}

// takes a poll_id and gets the information on it to populate the edit poll form
function editPollFormPopulate(poll_id) {
    console.log("client1");
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
        url: "/user/" + username + "/edit/" + poll_id,
        type: "post",
        
        dataType: "json",
        data: {
            question: $("#edit-poll-question").val(),
            choices: currentChoices,
            isVisible: false
        },
        
        complete: function() {
             console.log("got here");
            window.location.pathname = "/user/" + username;
        }
    })
}


// takes a poll and sets isVisible to true 
// (and thus can be viewed by anyone not just 
// the user logged in)
function sharePoll(username, poll_id) {
    $.ajax({
        url: "/user/" + username + "/share/" + poll_id,
        type: "get",
        
        success: function() {
            window.location.pathname = "/user/" + username;
        }
    })
}

function hidePoll(username, poll_id) {
    $.ajax({
        url: "/user/" + username + "/unshare/" + poll_id,
        type: "get",
        
        success: function() {
            window.location.pathname = "/user/" + username;
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
                top: "5%",
                right: "5%",
                bottom: "5%",
                left: "5%"
            },
            legend: {
                position: "right",
                alignment: "center",
                textStyle: {
                    fontSize: 20,
                    color: "#000"
                }
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
            $(".new-choice-add").slideUp();
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

function goToProfile() {
    var logged = parseCookies("logged");
    window.location.pathname = "/user/" + logged;
}

function parseCookies(str) {
    var arr = document.cookie.split(";");
    for(var i in arr) {
        var arr2 = arr[i].split("=");
        if(arr2[0] === str) {
            return arr2[1];
        }
    }
}