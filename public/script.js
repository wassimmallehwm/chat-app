let username = "";
do{
    username = prompt("Whats your username ?");
} while(username !== null && username === "")
// let socket = io('http://localhost:3000', {
//     query: {
//         username: username
//     }
// });
let socket = io.connect({
    query: {
        username: username
    }
});

let currentUser = {};

let users = [];

let private = false;

let sendTo = "";

const form = document.querySelector('#user-input');
const messageInput = document.querySelector('#user-message');
const chatList = document.querySelector('#messages');
const usersList = document.querySelector('.room-list');
messageInput.focus();

form.addEventListener('submit', formSubmission)


document.querySelector('.room').addEventListener('click', () => {
    form.removeEventListener('submit', priavteMessage);
    form.removeEventListener('submit', formSubmission);
    socket.emit('publicRoom');
    form.addEventListener('submit', formSubmission)
})


//on recieving message
socket.on('messageToClient', (data) => {
    console.log(data);
    console.log("Message from " + data.user + " (server)");
    chatList.innerHTML += buildHtml(data);
    chatList.scrollTo(0, chatList.scrollHeight);
})

socket.on('connect', () => {
    currentUser = {
        id: socket.id,
        username: username
    }
})

//display the history messages
socket.on('catchUp', (history) => {
    chatList.innerHTML = "";
    history.forEach((msgData) => {
        chatList.innerHTML += buildHtml(msgData);
    })
})

//add listener to alert close buttons
document.querySelector('#close-join-alert').addEventListener('click', () => {
    document.querySelector('#join-alert').classList.add('hidden');
})
document.querySelector('#close-leave-alert').addEventListener('click', () => {
    document.querySelector('#leave-alert').classList.add('hidden');
})

socket.on('userJoined', (data) => {
    username = data.username;

    //display alert of user join
    if(username != currentUser.username){
        const joinMsg = document.querySelector('#join-msg');
        joinMsg.innerHTML = "<strong>" + data.username + "</strong> has joined !";
        document.querySelector('#join-alert').classList.remove('hidden');
        setTimeout(() => {
            document.querySelector('#join-alert').classList.add('hidden');
        }, 3000);
    }

    //update the connected users list
    usersList.innerHTML = "";
    updateUsersList(data);
    chatList.scrollTo(0, chatList.scrollHeight);

    //private messages
    const userItem = Array.from(document.getElementsByClassName('user-item'));
    userItem.forEach((item) => {
        item.addEventListener('click', () => {
            form.removeEventListener('submit', priavteMessage);
            form.removeEventListener('submit', formSubmission);
            chatList.innerHTML = "";
            sendTo = item.id;
            console.log('private msg : ' + item.id);
            form.addEventListener('submit', priavteMessage)
        } )
    })
})

socket.on('privateMessageToclient', (data) => {
    console.log(data);
    //display message to recievre
})

function priavteMessage(event){
        event.preventDefault();
        const msg = messageInput.value;
        socket.emit('privateMessageToServer', {
            msg: msg,
            sender: currentUser.id,
            reciever: sendTo
        });
        console.log('private msg to : ' + sendTo);
        form.reset();
}

socket.on('removeUser', (data) => {

    //display alert of user left chatroom
    if(data.username != currentUser.username){
        const joinMsg = document.querySelector('#leave-msg');
        joinMsg.innerHTML = "<strong>" + data.username + "</strong> has left !";
        document.querySelector('#leave-alert').classList.remove('hidden');
        setTimeout(() => {
            document.querySelector('#leave-alert').classList.add('hidden');
        }, 3000);
    }

    //update the connected users list
    usersList.innerHTML = "";
    updateUsersList(data);
    chatList.scrollTo(0, chatList.scrollHeight);
})


//search box functionality
let searchBox = document.querySelector('#search-box');
    searchBox.addEventListener('input', (e) => {
        let messages = Array.from(document.getElementsByClassName('message-text'));
        let msgs = Array.from(document.getElementsByClassName('msg-item'));
        msgs.forEach((msgDiv) => {
            msg = msgDiv.lastElementChild.lastElementChild;
            const msgItem = msg.innerText.toLowerCase();
            const searchBoxData = e.target.value.toLowerCase();
            if(msgItem.indexOf(searchBoxData) === -1){
                msgDiv.style.display = "none";
            } else {
                msgDiv.style.display = "flex";
            }
        })
    })



function formSubmission(event) {
    event.preventDefault();
    const msg = messageInput.value;
    socket.emit('messageToServer', {msg: msg, user: currentUser.username});
    console.log(username + " sent message to server : " + msg);
    form.reset();
}

function buildHtml(data){
    const convertedDate = new Date().toLocaleString();
    const html = 
    "<li class='msg-item'>" + 
        "<div class='user-image'>" +
            "<img src='https://via.placeholder.com/30'/>" +
        "</div>" + 
        "<div class='user-message'>" + 
            "<div class='user-name-time'>" + data.user + 
                "<span class='msg-time'>" + convertedDate + "</span>" +
            "</div>" +
            "<div class='message-text'>" + data.msg+ "</div>" +
        "</div>" +
    "</li>";
    return html;
}

function updateUsersList(data){
    console.log(currentUser);
    data.users.forEach((user) => {
        if(user.username != currentUser.username){
            usersList.innerHTML += 
            "<li id=' "+ user.id +" ' class='user-item'>" + 
                "<div class='user-image aside-list'>" +
                    "<img src='https://via.placeholder.com/30'/>" +
                "</div>" +
                "<div class='user-message aside-list'>" + 
                    "<div class='user-name-time aside-list'>" + user.username +
                "</div>"; +
            "</li>"
        }
    })
}
