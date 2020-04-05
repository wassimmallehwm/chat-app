class Room {

    constructor(name, users) {
        this.name = name;
        this.users = users;
        this.history = [];
    }
    
    addMessage(message){
        this.history.push(message);
    }
    clearHistory(){
        this.history = [];
    }
}

module.exports = Room;