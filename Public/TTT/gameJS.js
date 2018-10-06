// 0-9 top, 10-19 high, 20-29 low , 30-39 bottom
// 0th-3rd up-dow, 4th-7th left-right, 8-9 diags
var horizontalLines = new Array(40);

// index = cell
var verticalLines = new Array(16);

var fullarr = new Array(64);

var sides = [1, 2, 4, 7, 8, 11, 13, 14];
var corners = [0, 3, 12, 15];

var Username = '';
var playerNum = 0;
var playerinfo;
var opponentinfo;
var stTime = new Date();
var playerProfile;

var playerturn = false;
var playernumMoves = 0;
var totalMoves = 0;
var prevMove = -1;

var socket = io.connect('http://localhost:8080');

//ini
function ini() {
    Username = localStorage.getItem("Username");
    if(Username == null){
        alert("Session expired. Please login again.");
        window.location.href = "/Login/Login.html";
    }
    var i;
    for (i = 0; i < 64; i++) {
        if(i < 16){
            verticalLines[i] = 0;
        }
        if(i < 40){
            horizontalLines[i] = 0;
        }
        fullarr[i] = 0;
    }

    $.ajax({
        method: 'post',
        url: '/getPlayerStats',
        data: 'Username='+Username,
        success: writeProfile
    });

}

function writeProfile(data){
    playerProfile = data[0];
}

//Player activate cell, checks if move is valid
function activate(arrindex, cell) {
    var index = cell + arrindex * 16;
    var celldata = [index, arrindex, cell];
    var flag = true;

    if (fullarr[index] != 0) {
        flag = false;
    }

    if (opponentinfo && playerturn && flag) {
        playernumMoves++;
        socket.emit('makemove', celldata, opponentinfo, playerNum);
        playerturn = false;
        var moveheader = opponentinfo[0] + "'s turn";
        $('#currMove').html(moveheader);
        change(celldata, playerNum);
    }
}

//Makes the move and calls checks to see if there is a line of 4
function change(celldata, player) {
    totalMoves++;
    var clr = '';
    if (player == 1) {
        clr = "#312fa8";
    } else {
        clr = "#911717";
    }
    document.getElementsByTagName("td")[(celldata[0])].style.backgroundColor = clr;
    document.getElementsByTagName("td")[(celldata[0])].style.border = "2px solid black";
    fullarr[celldata[0]] = player;

    if(prevMove != -1){
    document.getElementsByTagName("td")[prevMove].style.border = "1px solid black";
    }

    prevMove = celldata[0];
    //Checking

    if(player == playerNum){
        verticalLines[celldata[2]] += 1;    //Check for vertical lines in columns
        if (verticalLines[celldata[2]] == 4) {
            //console.log("VLines");
            victory();
        }
        if (chkVertDiags()) {
            //console.log("VDiags");
            victory();
        }
        if(chkHoriLines(celldata)){
            //console.log("HLines");
            victory();
        }
    }
}

//Check for all lines in each table that stay in the same table
function chkHoriLines(celldata) {
    //console.log("Table = ",celldata[1]);
    //console.log("Cell = ",celldata[2]);

    // "LeftRight" lines
    if(celldata[2] < 4){
        horizontalLines[4+celldata[1]*10]++;
        if(horizontalLines[4+celldata[1]*10] == 4){
            return true;
        }
    }else if(celldata[2] < 8){
        horizontalLines[5+celldata[1]*10]++;
        if(horizontalLines[5+celldata[1]*10] == 4){
            return true;
        }
    }else if(celldata[2] < 12){
        horizontalLines[6+celldata[1]*10]++;
        if(horizontalLines[6+celldata[1]*10] == 4){
            return true;
        }
    }else{
        horizontalLines[7+celldata[1]*10]++;
        if(horizontalLines[7+celldata[1]*10] == 4){
            return true;
        }
    }

    //"UpDown" Lines
    horizontalLines[(celldata[2]%4)+celldata[1]*10]++;
    if(horizontalLines[(celldata[2]%4)+celldata[1]*10] == 4){
        return true;
    }

    //Diagonal Lines
     if(celldata[2]%5 == 0){
        horizontalLines[8+celldata[1]*10]++;
        if(horizontalLines[8+celldata[1]*10] == 4){
            return true;
        }
    }

    if(celldata[2]%3 == 0 && celldata[2] < 15){
        horizontalLines[9+celldata[1]*10]++;
        if(horizontalLines[9+celldata[1]*10] == 4){
           return true;
        }
    }

    return false;
}

//Checks for all diagonal vertical lines
function chkVertDiags() {
    var i;
    var result;
    var adder;

    //Check sides
    for (i = 0; i < 8; i++) {
        adder = 4;
        switch (sides[i]) {
            case 1: //fallthrough
            case 2:
                adder = 4;
                break;
            case 4: //fallthrough
            case 8:
                adder = 1;
                break;
            case 7: //fallthrough
            case 11:
                adder = -1;
                break;
            case 13: //fallthrough
            case 14:
                adder = -4;
                break;
        }
        result = recur(sides[i],playerNum, adder, 0);

        if (result) {
            //console.log("SIDESresult = ", result);
            return result;
        }
    }

    //Check corners
    var neg = 1;
    var oneg = 1;
    for (i = 0; i < 4; i++) {
        result = recur(corners[i], playerNum, neg * 4, 0);

        if (result) {
            //console.log("CORNER1result = ", result);
            return result;
        }
        result = recur(corners[i], playerNum, oneg * 1, 0);

        if (result) {
            //console.log("CORNER2result = ", result);
            return result;
        }

        oneg *= -1;
        if (i == 1) {
            neg *= -1;
        }

    }

    neg = 1;
    oneg = 1;
    //Check DimenDiags
    for (i = 0; i < 4; i++) {
        result = recur(corners[i], playerNum, (neg * 4 + oneg * 1), 0);

        if (result) {
            //console.log("DDresult = ", result);
            return result;
        }

        oneg *= -1;
        if (i == 1) {
            neg *= -1;
        }

    }
    return false;
}

//Recursive function for checking diagonal vertical lines
function recur(cell, player, adder, n) {
    if (n == 4) {
        return true;
    }

    if (fullarr[cell] == player) {
        //console.log("THROUGH");
        return recur( (cell+16+adder) , player,adder, n + 1);
    } else {
        if(false){
            //console.log("False return");
        }
        return false;
    }
}

//victory
function victory() {
    //console.log("Victory!");
    //alert("You won!");
    endgame(true);
}

//Endgame save stats and return stats
function endgame(winner){
    socket.emit('EndGame',Username,stTime,winner,playernumMoves,false,opponentinfo);
    playerNum = 0;
    showOverlay(winner);
}

//When tab is closed, checks if game was ongoing
function closeTab(){
    if(playerNum != 0){ //playerNum != 0 if a game is ongoing
        socket.emit('EndGame',Username,stTime,false,playernumMoves,true,opponentinfo);
    }
    return false;
}

//Shows endgame overlay
function showOverlay(winner){
    $('#overlay').css("display","block")
    var wintxt;
    if(winner){
        wintxt = Username + " wins!!";
        playerinfo[2]++;
        opponentinfo[3]++;
    }else{
        wintxt = opponentinfo[0] + " wins!!";
        playerinfo[3]++;
        opponentinfo[2]++;
    }
    $('#winner').html(wintxt);
    $('#player1').html(Username);
    $('#player2').html(opponentinfo[0]);
    $('#pMoves').html(playernumMoves);
    $('#oMoves').html(totalMoves-playernumMoves);
    $('#pRec').html(playerinfo[2] + "-" + playerinfo[3]);
    $('#oRec').html(opponentinfo[2] + "-" + opponentinfo[3]);
}

//Sends user to home page or login page(and logs them out) based on their choice from endgame overlay
function Finish(logout){
    if(logout){
        window.location.href = "/Login/Login.html";
        localStorage.removeItem("Username");
    }else{
        window.location.href = "/Home/home.html";
    }
}

//Function calls
ini();


//----Socket
socket.on('connect', function () {
    //console.log("Socket ID = ", socket.id);
    socketid = socket.id;
    playerinfo = [Username, socket.id, playerProfile.Wins, playerProfile.Losses];

    //Tell server user ready to play
    socket.emit('play', playerinfo);

    //Server tells client to wait for other player
    socket.on('Wait', function (data) {
        //console.log(data);
        $('#phtext').html(data);
    });
    //Server tells client to start
    socket.on('Start', function (data, order) {
        console.log("Game start.");
        stTime = Date.now();

        playerNum = order;

        opponentinfo = data;

        var header = playerinfo[0] + "  vs  " + opponentinfo[0];
        header += "<br>" + playerinfo[2] + "-" + playerinfo[3] + "&nbsp&nbsp&nbsp&nbsp|&nbsp&nbsp&nbsp&nbsp" + opponentinfo[2] + "-" + opponentinfo[3];
        $('#phtext').html(header);

        var moveheader;
        if (playerNum == 1) {
            playerturn = true;
            moveheader = "<br>" + Username + " starts first.";
        } else {
            $('html').css('animation-name',"colorchange");
            setTimeout(function(){$('html').css("background-color","#ff9999"); }, 3000);

            moveheader = "<br>" + opponentinfo[0] + " starts first.";
        }
        $('#currMove').html(moveheader);

    });

    socket.on('opMove', function (celldata, pnum) {
        var moveheader = Username + "'s turn";
        var name;

        change(celldata, pnum);
        $('#currMove').html(moveheader);
        playerturn = true;

        if(pnum == 1){
            name = "flashred";
        }else{
            name = "flashblue";
        }
        $('html').css('animation-name',name);
        $('html').css('animation-duration',"2s");
        setTimeout(function(){ $('html').css('animation-name',""); }, 2500);
    });

    socket.on('Lost',function(){
        playerturn = false;
        endgame(false);
    });

    socket.on('opQuit',function(msg){
        alert(msg);
        playerturn = false;
        endgame(true);
    });
});
