const Chat = require('../model/chatSchema')
const fs = require('fs')
const path = require('path')

module.exports.getChat = async (req, res) => {
    try {
        const senderId = req.query.senderId;
        const receiverId = req.query.receiverId;

        if (!senderId || !receiverId) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        const data = await Chat.find({
            $or: [
                { sender_Id: senderId, reciever_Id: receiverId },
                { sender_Id: receiverId, reciever_Id: senderId }
            ],
            deletedBy: { $ne: senderId } // Don't fetch messages the requester has deleted for themselves
        }).sort({ createdAt: 1 }).populate('replyTo');

        res.status(200).json({ success: true, message: 'message get successfully.', data })

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching messages.', error })
    }
}

module.exports.sendChat = async (req, res) => {
    try {
        const recieverId = req.query.reciever_Id
        const senderId = req.query.sender_Id

        const chatData = {
            sender_Id: senderId,
            reciever_Id: recieverId,
            message: req.body.message,
            status: "sent",
        };

        if (req.file) {
            chatData.image = req.file.filename
        }

        const data = await Chat.create(chatData);
        req.app.get('io').emit('receiveMessage', { ...data.toObject(), status: "delivered" });
        res.status(201).json({ success: true, message: 'message sent successfully.', data })

    } catch (error) {
        res.status(404).json({ success: false, message: 'message sending error', error })
    }
}

module.exports.deleteMessage = async (req, res) => {
    try {
        let { messagesIds, deleteType } = req.body;
        const userId = req.user.id; // From verifyAccessToken

        if (typeof messagesIds === "string") {
            try {
                messagesIds = JSON.parse(messagesIds);
            } catch (err) {
                return res.status(400).json({ success: false, message: "Invalid messagesIds format" });
            }
        }

        if (!messagesIds || !Array.isArray(messagesIds) || messagesIds.length === 0) {
            return res.status(400).json({ success: false, message: "No message IDs provided" });
        }

        if (deleteType === "everyone") {
            // Check if user is the sender of all these messages
            const messages = await Chat.find({ _id: { $in: messagesIds } });
            const unauthorized = messages.some(m => m.sender_Id.toString() !== userId.toString());

            if (unauthorized) {
                return res.status(403).json({ success: false, message: "You can only delete your own messages for everyone." });
            }

            // Permanent delete images/files first
            for (const message of messages) {
                if (message.image) {
                    const oldImage = path.join(__dirname, '../Images/chatImage/', message.image)
                    if (fs.existsSync(oldImage)) fs.unlinkSync(oldImage)
                }
                if (message.fileUrl) {
                    const oldFile = path.join(__dirname, '../Images/chatFiles/', message.fileUrl)
                    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile)
                }
            }

            await Chat.deleteMany({ _id: { $in: messagesIds } });

            // Notify via socket
            req.app.get('io').emit('messagesDeleted', {
                messageIds: messagesIds,
                deleteType: 'everyone'
            });

        } else {
            // Delete for me
            await Chat.updateMany(
                { _id: { $in: messagesIds } },
                { $addToSet: { deletedBy: userId } }
            );
        }

        res.status(200).json({ success: true, message: 'Message deleted successfully.' })

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Message deleting error', error })
    }
}

module.exports.forwardMessages = async (req, res) => {
    try {
        const { messageIds, receiverIds } = req.body;
        const senderId = req.user.id;

        if (!messageIds || !receiverIds || !Array.isArray(messageIds) || !Array.isArray(receiverIds)) {
            return res.status(400).json({ success: false, message: "Invalid data provided" });
        }

        const originalMessages = await Chat.find({ _id: { $in: messageIds } });
        const io = req.app.get('io');
        const results = [];

        for (const receiverId of receiverIds) {
            for (const msg of originalMessages) {
                const forwardedMsg = await Chat.create({
                    sender_Id: senderId,
                    reciever_Id: receiverId,
                    message: msg.message,
                    image: msg.image,
                    fileUrl: msg.fileUrl,
                    fileType: msg.fileType,
                    fileName: msg.fileName,
                    isForwarded: true,
                    status: "sent"
                });

                // Emit to receiver via socket (simplificied for now, Index.js handles detailed status)
                io.emit('receiveMessage', forwardedMsg);
                results.push(forwardedMsg);
            }
        }

        res.status(201).json({ success: true, message: "Messages forwarded successfully", data: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Forwarding failed", error });
    }
}

module.exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            fileUrl: req.file.filename,
            originalName: req.file.originalname,
            fileType: req.file.mimetype
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: "File upload failed", error });
    }
}