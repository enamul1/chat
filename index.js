const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
require('dotenv').config();
const redis = require('redis');

let client = '';

const port = process.env.PORT || 8080;

// Start the Server
http.listen(port, function () {
    console.log('Server Started. Listening on *:' + port);
});

client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
client.on('connect', function() {
    console.log('connected');
});


const users = [
    {
        user_name:'Alex',
        email: 'alex@gmail.com'
    },
    {
        user_name:'Smith',
        email: 'smith@gmail.com'
    },
    {
        user_name:'Samantha',
        email: 'sam@gmail.com'
    }
];
// Store messages in chatroom
let messages = [];

// Express Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

// Render Main HTML file
app.get('/', function (req, res) {
    res.sendFile('views/index.html', {
        root: __dirname
    });
});

// API - Join Chat
app.post('/login', function (req, res) {
    let username = req.body.username;
    let result = [];
    if (users.find(user => user.email == username)) {
        new Promise((resolve, reject) => {
            client.get('logged_in_users', function (err, reply) {
                if (reply) {
                    result = JSON.parse(reply);
                }
                resolve(result); 
            });
        }).then((result) => {
            return new Promise(function(resolve, reject) {
                result.push(username);
                client.set('logged_in_users', JSON.stringify([...new Set(result)]));
                resolve('success'); 
            });
            
        }).then((result) => {
            res.send({
                users: users.filter(user => user.email != username),
                'status': 'OK'
            });
        }).catch((err) => {
            console.log('something went wrong');
            console.log(err);
        });
    } else {
        res.send({
            'status': 'FAILED'
        });
    }
});

// API - Logout
app.post('/logout', function (req, res) {
    // @TODO
});

// API - Send + Store Message
app.post('/messages', function (req, res) {
    let from = req.body.from;
    let to = req.body.to;
    let message = req.body.message;
    messages.push({from, message, to});
    filteredMessages = messages.filter((data) => {return data.from == from && data.to == to});
    client.set(from+'_'+to, JSON.stringify(filteredMessages));
    res.send({
        'status': 'OK',
        messages,
    });
});

// API - Get Messages
app.get('/messages', function (req, res) {
    let result = [];
    let user1 = req.query.user1;
    let user2 = req.query.user2;
    new Promise((resolve, reject) => {
        client.get(user1+'_'+user2, function (err, reply) {
            if (reply) {
                result = JSON.parse(reply);
            }
            resolve(result); 
        });
    }).then((result) => {
        return new Promise(function(resolve, reject) {
            client.get(user2+'_'+user1, function (err, reply) {
                if (reply) {
                    result = result.concat(JSON.parse(reply));
                }
                resolve(result); 
            });
        });
        
    }).then((result) => {
        let messages = result;
        res.send(messages);
    }).catch((err) => {
        console.log('something went wrong');
        console.log(err);
    });
});


// Socket Connection
// UI Stuff
io.on('connection', function (socket) {

    // Fire 'send' event for updating Message list in UI
    socket.on('message', function (data) {
        socket.emit("send", data);
        socket.broadcast.to(data.toEmail).emit("send", data);
    });

    socket.on('login', function(username){
        socket.join(username);
    });
});
