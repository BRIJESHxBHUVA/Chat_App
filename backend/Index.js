const express = require('express')
const app = express()
const cors = require('cors')
const db = require('./database/db')
const http = require('http')
const socketIo = require('socket.io')
const path = require('path')
const dotenv = require('dotenv').config()
const port = process.env.SERVER_PORT
const bodyParser = require('body-parser');

const server = http.createServer(app)
const io = socketIo(server)

app.use(express.json())
app.use(bodyParser.json());
app.use(express.urlencoded())
app.use(cors())
app.set('io', io)

app.use('/Images', express.static(path.join(__dirname, 'Images')))
app.use('/Images/user', express.static(path.join(__dirname, 'Images/user')))
app.use('/Images/chatImage', express.static(path.join(__dirname, 'Images/chatImage')))


app.use('/api/user', require('./routing/userRoutes'))
app.use('/api/chat', require('./routing/chatRoutes'))


io.on('connection', (socket)=> {
    console.log("A user connected:", socket.id)

    socket.on('sendMessage', (messageData)=> {
        io.emit('receiveMessage', messageData);
    });

    socket.on('disconnect', ()=> {
        console.log('User  disconnected:', socket.id);
    })
});


app.listen(port, (err)=> {
    if(err){
        console.log('Server starting error.'. err)
    }else{
        console.log('Server starting on port '+port)
    }
})