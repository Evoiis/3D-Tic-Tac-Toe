var Username = '';
var toGame = false;
function ini(){
    Username = localStorage.getItem("Username");
    if(Username != null){
        $("#UsernameHead").html("Welcome "+Username+"!");
        $.ajax({
            method: 'post',
            url: '/getPlayerStats',
            data: 'Username='+Username,
            success: printStats
        });
    }else{
        alert("Session expired. Please login again.");
        window.location.href = "/Login/Login.html";
    }

}

//Print table of stats
function printStats(data){
    if(data){
        var tableHTML = '<table><tr><th>Date of Registration</th><th>Last Game</th><th>Wins - Losses</th><th>Moves</th></tr>';
        var RegTime = new Date(data[0].RegistrationTime);
        var LasGTime = new Date(data[0].LastGame);
        tableHTML += "<tr>";
        tableHTML += "<td>"+RegTime.toLocaleString()+"</td></th>";
        if(LasGTime.getFullYear() != 1969){
            tableHTML += "<td>"+LasGTime.toLocaleString()+"</td></th>";
        }else{
            tableHTML += "<td>N/A</td></th>";
        }
        tableHTML += "<td>"+data[0].Wins+" - "+data[0].Losses+"</td></th>";
        tableHTML += "<td>"+data[0].NumMoves+"</td></th>";
        tableHTML += "</tr>";
        tableHTML += "</table>";

        $('#tab').html(tableHTML);
    }else{
        //Data not found
        console.log("Error Occurred! Please try logging in again..");
    }
}

function LoadGame(){
    toGame = true;
    window.location.href = "/TTT/game.html";

}

function closeTab(){
    if(!toGame){//"logs user out" if on tab close if user is not going to the game
        localStorage.removeItem("Username");
    }
}

//Function Calls
ini();


/*
//No longer using cookies to store Username

//Reads cookies and searches for Username
function getUsername(){
    console.log("cookies = ",document.cookie);
    //var cookies = document.cookie;
    var decodecooks = decodeURIComponent(document.cookie);
    var splitcooks = decodecooks.split(';');
    var i;
    var c;
    var result = '';
    //console.log("SC = ",splitcooks,"and len = ", splitcooks.length);
    for(i = 0;i < splitcooks.length;i++){
        if(splitcooks[i].indexOf('Username') == 1 || splitcooks[i].indexOf('Username') == 0){
            console.log("Cookie Found");
            for(c = splitcooks[i].indexOf('=') + 1;c < splitcooks[i].length;c++){
                result += splitcooks[i][c];
            }
        }
    }
    return result;
}
*/
