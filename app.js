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

        var existRoom = roomsList.find(obj => {
            return obj.users[0] === data.sender && obj.users[1] === data.reciever || 
            obj.users[1] === data.sender && obj.users[0] === data.reciever;        
        })

        if(existRoom == undefined){
            let privateRoom = new Room("room" + roomIndex, [data.sender, data.reciever]);
            roomIndex++;
            
            console.log("NEW ROOM ...");
            let recieverSocket = io.sockets.clients().connected[data.reciever];
            // socket.join(privateRoom.name);
            // recieverSocket.join(privateRoom.name);
            privateRoom.history.push(data);
            roomsList.push(privateRoom);
            socket.to(data.reciever).emit('privateMessageToclient', {
                message: data.msg,
                from: data.sender,
                room: privateRoom,
                history: privateRoom.history
            });
        } else {
            console.log("EXIST ROOM ...");
            let recieverSocket = io.sockets.clients().connected[data.reciever];
            // socket.join(existRoom.name);
            // recieverSocket.join(existRoom.name);
            existRoom.history.push(data);
            socket.to(data.reciever).emit('privateMessageToclient', {
                message: data.msg,
                from: data.sender,
                room: existRoom,
                history: existRoom.history
            });
        }
    });

    socket.on('checkPrivateMessages', (data) => {
        console.log('check private chat ...');
        console.log(data);
        data.users[0] = data.users[0].trim();
        data.users[1] = data.users[1].trim();
        var existRoom = roomsList.find(obj => {
            return obj.users[0] === data.users[0] && obj.users[1] === data.users[1] || 
            obj.users[1] === data.users[0] && obj.users[0] === data.users[1];        
        })
        if(existRoom != undefined){
            console.log('Room exists ...');
            console.log(existRoom.history);
            socket.emit('updatePrivateChat', {history: existRoom.history, chatWith: data.users[0]});
        }else {
            console.log('Room DOES NOT exists ...');
        }
    })

    socket.on('disconnect', () => {
        var index = users.indexOf(users.find(elem => elem.username == socket.username));
        if (index !== -1) users.splice(index, 1);
        currentUser = {};
        io.emit('removeUser', {users: users, username: socket.username, id: socket.id});
    })
})