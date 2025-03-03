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
    }
},{timestamps: true})

const Chat = mongoose.model('Chat', ChatSchema)
module.exports = Chat


