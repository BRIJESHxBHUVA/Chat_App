const mongoose = require('mongoose')

const ChatSchema = new mongoose.Schema({
    reciever_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String
    },
    image: {
        type: String
    },
    fileUrl: {
        type: String
    },
    fileType: {
        type: String
    },
    fileName: {
        type: String
    },
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isForwarded: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "seen"
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    }
}, { timestamps: true })

const Chat = mongoose.model('Chat', ChatSchema)
module.exports = Chat


