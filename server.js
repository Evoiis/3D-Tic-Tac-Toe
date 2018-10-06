/********************
Anthony Cheung
CMPT 218
3D Tic Tac Toe Game
Features: Multiplayer, User Profiles and Game stats, CSS Animations(BackgroundFlashOnMove and ColorChanges), and more
Start Date: March 29, 2018
********************/

var express = require('express');
var app = express();
var http = require('http');
var async = require('async');
var port = process.env.PORT || 8080;

var server = http.createServer(app);
server.listen(port);
console.log('running on port',port);

//--------Mongoose
var mongoose = require('mongoose');
var url = "mongodb://localhost:27017/users";
mongoose.connect( url );
var mongodb = mongoose.connection;

mongodb.on('error', function(){console.log("Mongoose failed to connect....") });
mongodb.once('open', function(){
  console.log('Mongodb connection successful.');

});

var Schema = mongoose.Schema;
var playerSchema = new Schema({
    Username: {type:String},
    Password: {type:String},
    Firstname: {type:String},
    Lastname: {type:String},
    Gender: {type:String},
    Age: {type:Number},
    Email: {type:String},
    //Game stats:
    RegistrationTime: {type:Date},
    LastGame: {type:Date},
    Wins: {type:Number},
    Losses: {type:Number},
    NumMoves: {type:Number},
});
var PlayerModel = mongoose.model('TTTplayer', playerSchema);

//------Socket
var io = require('socket.io')(server);

//var numClients = 0;
var playerWaiting = null;

io.on('connection',function(socket){

    //console.log("SOCKET ID = ", socket.id);
    //numClients++;
    //console.log("#Ci = ",numClients)

    /*  Not implemented... yet?
    //Broadcasts msgs for chat
    socket.on('homechat',function(data){
        console.log(data);
        socket.broadcast.emit('msg',data);
    });
    */

    socket.on('disconnect', function(){
        //numClients--;
        if(playerWaiting){
            if(playerWaiting[1] == socket.id){
                playerWaiting = null;
            }
        }
    });

    socket.on('play', function(data){
        if(playerWaiting == null){
            playerWaiting = data;
            console.log("playerWaiting = ", playerWaiting);
            socket.emit('Wait',"Please wait for another player.");
        }else{
            if(playerWaiting[0] == data[0]){
                console.log("Same player...");
            }
            console.log("2 Players ready.");
            var pnum;
            var pnumalter;
            if(Math.floor(Math.random()*100) >50){
                pnum = 1;
                pnumalter = 2;
            }else{
                pnum = 2;
                pnumalter = 1;
            }

            socket.emit('Start',playerWaiting,pnum);
            socket.to(playerWaiting[1]).emit('Start',data,pnumalter);
            playerWaiting = null;
            console.log("playerWaiting = ", playerWaiting);
        }

    });

    socket.on('makemove',function(celldata,opinfo,pnum){
        socket.to(opinfo[1]).emit('opMove',celldata,pnum);
    });

    socket.on('EndGame',function(User,time,winlose,moves,quit,opinfo){
        if(quit){
            socket.to(opinfo[1]).emit('opQuit',"You won! Opponent quit/disconnected.");
        }else{
            if(winlose){
                socket.to(opinfo[1]).emit('Lost',"");
            }
        }
        var newdata = {
            LastGame: time,
        }
        PlayerModel.find({Username: User}, function(err, data){
            //console.log("FindData: ", data);
            if(err){
                //Error occurred
                console.log("ERROR: ",err);
                //callback(true,false);
            }else if(data.length == 0){
                //no documents found in collection with Username
                //callback(null,false);
            }else{
                if(winlose){
                    newdata.Wins = data[0].Wins + 1;
                }else{
                    newdata.Losses = data[0].Losses + 1;
                }

                newdata.NumMoves = data[0].NumMoves + moves;

                //Update data in database
                PlayerModel.updateOne({Username: User},newdata, function(err){
                    if(err){
                        console.log("UpOneError: ",err);
                    }
                });
            }

        });


    });
});

//--------Express

//Parse
app.use(express.json());
app.use(express.urlencoded( { extended:false} ));

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm','html'],
  index: "Login/Login.html"
}

//User logging in
app.post('/Login',function(req,res,next){
    console.log(req.method,' request: ', req.url);
    //console.log('Data = ', req.body);

    var User = req.body.Username;
    var Pass = req.body.Password;

    //Searches database for Username
    //Then checks if Password matches
    async.waterfall([
        async.apply(ChkDatabaseForPlayer,User),
        async.apply(validate,Pass),
        function(msg,result,callback){
            //res.json(result);
            if(result){
                res.json(true);
            }else{
                res.json(false);
            }
            callback(null,msg);
        },
    ],
        function(err,msg){
            if(err){
                console.log("Error: ",err);
            }else{
                console.log("Res: ",msg);
            }
        }
    );
});

//User registering
app.post('/Register', function(req,res){
    console.log(req.method,' request: ', req.url);
    //console.log('Data = ', req.body);

    var User = req.body.Username;
    var RetMessage = '';

    async.waterfall([
        async.apply(ChkDatabaseForPlayer,User),
        function(dbPass,callback){
            console.log("Here =",dbPass);
            if(dbPass != false){
                //Username already used
                console.log("Registration failed. Taken Username.");
                res.json("RegFail");
            }else{
                var regPlayer = new PlayerModel({
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Firstname: req.body.Firstname,
                    Lastname: req.body.Lastname,
                    Gender: req.body.Gender,
                    Age: req.body.Age,
                    Email: req.body.Email,

                    RegistrationTime: Date.now(),
                    LastGame: 0,
                    Wins: 0,
                    Losses: 0,
                    NumMoves: 0,
                });

                regPlayer.save(function(err){
                    if(err){
                        res.json("SaveFail");
                        callback(err,"Error saving to database!");
                    }else{
                        res.json(true);
                        callback(null,"Success! User registered.");
                    }
                });
            }
        }
        ],
        function(err,res){
            if(err){
                console.log("Error in Reg Waterfall: ", err);
            }else{
                console.log(res);
            }
        }
    );
});

app.post('/getPlayerStats', function(req,res){
    console.log(req.method,' request: ', req.url);
    console.log('Data = ', req.body);

    PlayerModel.find({Username: req.body.Username}, function(err, data){
        //console.log("FindData: ", data);
    if(err){
        //Error occurred
        console.log("ERROR: ",err);
        res.json(false);
    }else if(data.length == 0){
        //no documents found in collection with Username
        console.log("ERROR: USER NOT FOUND IN DATABASE");
        res.json(false);
    }else{
        //Document with matching Username found in collection
        console.log("User found.");
        res.json(data);
    }
    });

});

app.use(express.static(__dirname + "/Public", options));

//-----Functions

//Looks for document with Username == UNameinput
//returns false when Error or no document with UNameinput
//returns password document when UNameinput is found
function ChkDatabaseForPlayer(UNameinput,callback){
    PlayerModel.find({Username: UNameinput}, function(err, data){
        //console.log("FindData: ", data);
    if(err){
        //Error occurred
        console.log(err);

        console.log("ERROR: ",err);
        callback(true,false);

    }else if(data.length == 0){
        //no documents found in collection with Username
        callback(null,false);

    }else{
        //Document with matching Username found in collection
        callback(null,data[0].Password);

    }
    });
}

//Checks if inpPass is equal to dbPass
function validate(inpPass,dbPass,callback){
    console.log("Validate: dbPass = ",dbPass,"  inpPass = ",inpPass);
    if (inpPass == dbPass && dbPass != false){
        //return true;
        callback(null,'Login success',true);
    }else{
        //return false;
        callback(null,'Invalid Credentials Entered',false);
    }
}
