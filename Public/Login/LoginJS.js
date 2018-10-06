var Username = '';
function Login(){
    Username = $('#Username').val();
    $.ajax({
        method: 'post',
        url: '/Login',
        data: 'Username=' + Username + '&Password=' + $('#Password').val(),
        success: goHome
    });
}

function BeginReg(){
    $('#Registration').css('all','unset');
    $('#Registration').empty();
    var moreInp = 'Firstname:<br><input type="text" id="Firstname" name="Firstname"/><br>Lastname:<br><input type="text" id="Lastname" name="Lastname"/><br>Gender:<br><select name ="Gender" id="Gender"><option value="Male">Male</option><option value="Female">Female</option></select><br>Age:<br><input type="number" id="Age" name="Age"/><br>Email:<br><input type="email" id="Email" name="Email"/><br><button onclick="Register()">REGISTER</button><br>*We will never sell your information.';
    $('#RegInfo').html(moreInp);
}

function Register(){
    Username = $('#Username').val();
    $.ajax({
        method: 'post',
        url: '/Register',
        data: 'Username=' + Username + '&Password=' + $('#Password').val() + '&Firstname=' + $('#Firstname').val() + '&Lastname=' + $('#Lastname').val() + '&Age=' + $('#Age').val() + '&Email=' + $('#Email').val() + '&SocketID=' + socketid,
        success: goHome
    });
}

function goHome(data){

    if(data){
        if(data == "RegFail"){
            alert("Sorry, that Username is already taken.");
        }else if(data == "SaveFail"){
            alert("There was an error saving to the database. Please try again later.");
        }else{
            window.location.href = "/Home/home.html";
            localStorage.setItem("Username",Username);
        }
    }else{
        alert("Invalid Credentials");
    }
}

//-----socket
var socket = io.connect('http://localhost:8080');
var socketid;

socket.on('connect', function(){
    socketid = socket.id;
});
socket.on('response', function(data){
    alert(data);
});
