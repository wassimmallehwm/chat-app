const express = require('express');
const app = express();
const socketio = require('socket.io');
const expressServer = app.listen(3000);
const io = socketio(expressServer);
const Room = require('./classes/Room');
console.log('listening on port 3000');

let users = [];

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendfile(__dirname + "/public/index.html");
})
let roomIndex = 1;

let currentUser = {};

let globalHistory = [];

let roomsList = [];
let checkRoom = {};
let room = {};

io.on('connection', (socket) => {
    socket.username = socket.handshake.query.username;

    socket.emit('catchUp', globalHistory);
    // if(username == 'null'){
    //     username = 'newUser ' + userIndex;
    //     userIndex++;
    // }
    users.push({id: socket.id, username: socket.username});

    socket.on('publicRoom', () => {
        socket.emit('catchUp', globalHistory);
    })

    io.emit('userJoined', {users: users, username: socket.username, id: socket.id});

    socket.on('messageToServer', (data) => {
        globalHistory.push(data);
        io.emit('messageToClient', data);
    })

    socket.on('privateMessageToServer', (data) => {
        data.sender = data.sender.trim();
        data.reciever = data.reciever.trim();

        // for(var i = 0; i < roomsList.length; i++) {
        //     if (roomsList[i].users == [data.sender, data.reciever] ||
        //         roomsList[i].users == [data.reciever, data.sender]) {
        //         checkRoom = roomsList[i];
        //         break;
        //     }
        // }

        // if(checkRoom != {}){
        //     room = checkRoom;
        //     //room.addMessage(data);
        // } else {

            room = new Room("room" + roomIndex, [data.sender, data.reciever]);
            roomIndex++;
            let recieverSocket = io.sockets.clients().connected[data.reciever];
            //console.log(io.sockets.clients().connected[socket.id]);
            //console.log(io.sockets.clients());
            //console.log(recieverSocket);
            socket.join(room.name);
            recieverSocket.join(room.name);
            //room.addMessage(data);
            room.history.push(data);
        //}
        console.log("*********PRIVATE MESSAGE*********");
        console.log(room);
        console.log("******************************");
        socket.to(room.name).emit('privateMessageToclient', {message: data.msg, from: data.sender});
    })

    socket.on('disconnect', () => {
        var index = users.indexOf(users.find(elem => elem.username == socket.username));
        if (index !== -1) users.splice(index, 1);
        currentUser = {};
        io.emit('removeUser', {users: users, username: socket.username, id: socket.id});
    })
})