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
const User = require('./model/userSchema')
const Chat = require('./model/chatSchema')

const server = http.createServer(app)
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.set('io', io)

app.use('/Images', express.static(path.join(__dirname, 'Images')))
app.use('/Images/user', express.static(path.join(__dirname, 'Images/user')))
app.use('/Images/chatImage', express.static(path.join(__dirname, 'Images/chatImage')))
app.use('/Images/chatFiles', express.static(path.join(__dirname, 'Images/chatFiles')))


app.use('/api/user', require('./routing/userRoutes'))
app.use('/api/chat', require('./routing/chatRoutes'))


const userSockets = new Map();

io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        // Only mark online if this is the first connection
        if (userSockets.get(userId).size === 1) {
            await User.findByIdAndUpdate(userId, { is_online: true, last_seen: null });
            io.emit("user_online", { userId });
        }

        console.log('User connected', userId);
        socket.userId = userId;
    }

    socket.on("sendMessage", async (payload) => {
        try {
            const { sender_Id, reciever_Id, message, image, fileUrl, fileType, fileName, replyTo } = payload;

            // Check if receiver is online
            const isReceiverOnline = userSockets.has(reciever_Id) && userSockets.get(reciever_Id).size > 0;
            const initialStatus = isReceiverOnline ? "delivered" : "sent";

            let chat = await Chat.create({
                sender_Id,
                reciever_Id,
                message,
                image,
                fileUrl,
                fileType,
                fileName,
                replyTo,
                status: initialStatus,
            });

            if (replyTo) {
                chat = await Chat.findById(chat._id).populate('replyTo');
            }

            // Send to sender (confirmation)
            socket.emit("receiveMessage", chat);

            // Send to receiver if online
            if (isReceiverOnline) {
                const receiverSocketIds = userSockets.get(reciever_Id);
                receiverSocketIds.forEach(socketId => {
                    io.to(socketId).emit("receiveMessage", chat);
                });

                // Notify sender that message was delivered
                socket.emit("messageStatusUpdate", {
                    messageId: chat._id,
                    status: "delivered"
                });
            }
        } catch (error) {
            console.error("Sending message error", error);
        }
    });

    socket.on("messageSeen", async ({ messageIds, senderId, receiverId }) => {
        try {
            // Update all messages to seen
            await Chat.updateMany(
                { _id: { $in: messageIds } },
                { $set: { status: "seen" } }
            );

            // Notify the sender that messages were seen
            if (userSockets.has(senderId)) {
                const senderSocketIds = userSockets.get(senderId);
                senderSocketIds.forEach(socketId => {
                    io.to(socketId).emit("messageStatusUpdate", {
                        messageIds,
                        status: "seen",
                        receiverId // So frontend knows which user read messages
                    });
                });
            }
        } catch (error) {
            console.error("Error marking messages as seen", error);
        }
    });

    socket.on("disconnect", async () => {
        if (userId && userSockets.has(userId)) {
            userSockets.get(userId).delete(socket.id);

            // If no more sockets for this user, mark offline
            if (userSockets.get(userId).size === 0) {
                userSockets.delete(userId);
                console.log("User disconnected", userId);

                await User.findByIdAndUpdate(userId, { is_online: false, last_seen: Date.now() });
                io.emit("user_offline", { userId, last_seen: Date.now() });
            }
        }
    });
});

server.listen(port, (err) => {
    if (err) {
        console.log('Server starting error.'.err)
    } else {
        console.log("Server + Socket.IO running on port " + port);
    }
})