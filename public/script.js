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
const privateChatList = document.querySelector('#private-messages');
const privateChatContent = document.querySelector('#private-chat-content');
const chatWith = document.querySelector('#chat-with');
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
    const input = {
        msg: data.msg,
        user: data.user
    };
    chatList.innerHTML += buildHtml(input);
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
    showPublicChatList();
    chatList.innerHTML = "";
    history.forEach((msgData) => {
        chatList.innerHTML += buildHtml(msgData);
        chatList.scrollTo(0, chatList.scrollHeight);
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
            removeBackgroundColor(userItem);
            item.style.backgroundColor = "#e4e2e24d";
            form.removeEventListener('submit', priavteMessage);
            form.removeEventListener('submit', formSubmission);
            privateChatContent.innerHTML= "";
            sendTo = item.id.trim();
            showPrivateChatList(findUserById(sendTo));
            if(item.childElementCount === 3){
                item.childNodes.item(2).remove();
            }
            form.addEventListener('submit', priavteMessage)
            socket.emit('checkPrivateMessages', {users: [sendTo, currentUser.id]});
        })
    })
})

function removeBackgroundColor(elem){
    elem.forEach((item) => {
        item.style.backgroundColor = "";
    })
}

socket.on('updatePrivateChat', (data) => {
    data.history.forEach((value) => {
        let input = {
            user: findUserById(value.sender),
            msg: value.msg
        }
        console.log("********** HISTORY **********");
        console.log(input);
        privateChatContent.innerHTML += buildHtml(input);
        privateChatList.scrollTo(0, privateChatList.scrollHeight);
    })
})

socket.on('privateMessageToclient', (data) => {
    const userItem = Array.from(document.getElementsByClassName('user-item'));
    userItem.forEach((item) => {
        elemntChildCount = item.childElementCount;
        console.log("Node Elements " + elemntChildCount);
        if(data.from == item.id.trim()){
            if(privateChatList.getAttribute('user') == data.from){
                console.log("Display my private message");
                privateChatContent.innerHTML += buildHtml({user: findUserById(data.from), msg: data.message});
                privateChatList.scrollTo(0, privateChatList.scrollHeight);
            } else {
                if(elemntChildCount == 2) {
                    var node = document.createElement("div");
                    var textnode = document.createTextNode("1");
                    node.appendChild(textnode);  
                    node.classList.add('msg-count');
                    item.appendChild(node);
                } else {
                    let msgsCount = parseInt(item.childNodes.item(2).textContent);
                    msgsCount++;
                    const msgCountDisplay = "" + msgsCount;
                    item.childNodes[2].remove();
                    var node = document.createElement("div");
                    var textnode = document.createTextNode(msgCountDisplay);
                    node.appendChild(textnode);  
                    node.classList.add('msg-count');
                    item.appendChild(node);
                }
            }
        }
    })
})

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
    socket.emit('messageToServer', {msg: msg, user: currentUser});
    form.reset();
}

function priavteMessage(event){
    event.preventDefault();
    const msg = messageInput.value;
    socket.emit('privateMessageToServer', {
        msg: msg,
        sender: currentUser.id,
        reciever: sendTo
    });
    privateChatContent.innerHTML += buildHtml({user: findUserById(currentUser.id), msg: msg});
    privateChatList.scrollTo(0, privateChatList.scrollHeight);
    form.reset();
}

function buildHtml(data){
    const convertedDate = new Date().toLocaleTimeString();

    if(currentUser.id.trim() == data.user.id.trim()){
        const html = 
        "<li class='msg-item own-message'>" +
            "<div class='user-message'>" + 
                "<div class='user-name-time'>" +
                    "<span class='msg-time'>" + convertedDate + "</span>" +
                "</div>" +
                "<div class='message-text'>" + data.msg+ "</div>" +
            "</div>" +
        "</li>";
        return html;
    } else {
        const html = 
        "<li class='msg-item other-msg'>" + 
            "<div class='user-image'>" +
                "<img class='user-img-item' src='https://i.ya-webdesign.com/images/businessman-png-icon-1.png'/>" +
            "</div>" + 
            "<div class='user-message'>" + 
                "<div class='user-name-time'>" + data.user.username + 
                    "<span class='msg-time'>" + convertedDate + "</span>" +
                "</div>" +
                "<div class='message-text'>" + data.msg+ "</div>" +
            "</div>" +
        "</li>";
        return html;
    }
}

function findUserById(id){
    var user = users.find(obj => {
        return obj.id === id;        
    })
    return user;
}

function showPrivateChatList(user){
    chatList.classList.add('hidden');
    privateChatList.classList.remove('hidden');
    privateChatList.setAttribute('user', user.id);
    chatWith.innerText = user.username;
}

function showPublicChatList(){
    privateChatList.classList.add('hidden');
    privateChatList.setAttribute('user', "");
    chatList.classList.remove('hidden');
}

function updateUsersList(data){
    users = [];
    data.users.forEach((user) => {
        users.push({id: user.id, username: user.username});
        if(user.username != currentUser.username){
            usersList.innerHTML += 
            "<li id=' "+ user.id +" ' class='user-item'>" + 
                "<div class='user-image aside-list'>" +
                    "<img class='user-img-item' src='https://i.ya-webdesign.com/images/businessman-png-icon-1.png'/>" +
                "</div>" +
                "<div class='user-message aside-list'>" + 
                    "<div class='user-name-time aside-list'>" + user.username +
                "</div>"; +
            "</li>"
        }
    })
}
