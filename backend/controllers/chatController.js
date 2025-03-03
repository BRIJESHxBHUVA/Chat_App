const Chat = require('../model/chatSchema')
const fs = require('fs')
const path = require('path')

module.exports.getChat = async(req, res)=> {

    try {

        const { sender_Id, reciever_Id } = req.query;

        if (!sender_Id || !reciever_Id) {
            return res.status(400).json({ success: false, message: 'Sender ID and Receiver ID are required.' });
        }

        const data = await Chat.find({
            $or: [
                { sender_Id, reciever_Id },
                { sender_Id: reciever_Id, reciever_Id: sender_Id }
            ]
        }).sort({ createdAt: 1 });

        if(data.length <= 0){
           return res.status(200).json({success: true, message: 'message not found.'})
        }

        res.status(200).json({success: true, message: 'message get successfully.', data})

    } catch (error) {
        res.status(404).json({success: false, message: 'message getting error.', error})
    }
}

module.exports.sendChat = async(req, res)=> {

    try {

        const recieverId = req.query.reciever_Id
        const senderId = req.query.sender_Id

        const chatData = {
            sender_Id: senderId,
            reciever_Id: recieverId,
            message: req.body.message,
        };

        if(req.file){
            chatData.image = req.file.filename 
        }

        const data = await Chat.create(chatData)
        req.app.get('io').emit('receiveMessage', data)
        res.status(201).json({success: true, message: 'message sent successfully.', data})

    } catch (error) {
        res.status(404).json({success: false, message: 'message sending error', error})
    }
}

module.exports.deleteMessage = async(req, res)=> {
    try {
        const {messagesIds} = req.body

        const deleteImage = await Chat.find({_id: {$in: messagesIds } })

        for (const message of deleteImage) {
            if(message.image){
                const oldImage = path.join(__dirname, '../Images/chatImage/', message.image)
                if(fs.existsSync(oldImage)){
                    fs.unlinkSync(oldImage)
                }
            }

        }

        if(!messagesIds || !Array.isArray(messagesIds) || messagesIds.length === 0){
            return res.status(400).json({success: false, message: 'Message not deleted'})
        }

        const data = await Chat.deleteMany({_id: {$in: messagesIds} })
        res.status(200).json({success: true, message: 'Message deleted successfully.', data})

    } catch (error) {
        res.status(404).json({success: false, message: 'Message deleting error', error})
    }
}