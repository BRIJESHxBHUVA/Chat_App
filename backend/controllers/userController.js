const User = require('../model/userSchema')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')
const { default: mongoose } = require('mongoose')


module.exports.allUser = async (req, res) => {
    try {
        const data = await User.find({})
        if (data.length <= 0) {
            return res.status(404).json({ success: false, message: 'User not found.' })
        }
        res.status(200).json({ success: true, message: 'Users getting successfully.', data })

    } catch (error) {
        res.status(400).json({ success: false, message: 'Users getting error', error })
    }
}


module.exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email: email })

        if (!user) {
            return res.status(404).json({ success: false, message: 'Invalid email address.' });
        }

        if (password !== user.password) {
            return res.status(400).json({ success: false, message: 'Invalid password.' });
        }

        const accessToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        )

        const refreshToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
        )

        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({ success: true, message: 'Login successfully', accessToken, refreshToken, data: user })


    } catch (error) {
        res.status(500).json({ success: false, message: 'User login error.', error: error.message });
    }
}


module.exports.addUser = async (req, res) => {
    try {

        const existUser = await User.findOne({ email: req.body.email })
        if (existUser) {
            return res.status(400).json({ success: false, message: 'User email already exists.' })
        }

        if (req.file) {
            req.body.image = req.file.filename
        }
        const data = await User.create(req.body)
        res.status(201).json({ success: true, message: 'User regestration successfully.', data })


    } catch (error) {
        res.status(400).json({ success: false, message: 'User regestration error', error })
    }
}


module.exports.editUser = async (req, res) => {
    try {

        const data = await User.findById(req.query.id)
        res.status(200).json({ success: true, message: 'User edit data get successfully.', data })

    } catch (error) {
        res.status(400).json({ success: false, message: 'User editing error', error })
    }
}


module.exports.edit = async (req, res) => {
    try {

        const edituser = await User.findById(req.query.id)
        if (edituser.image) {
            const oldImage = path.join(__dirname, '../Images/user/', edituser.image)
            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage)
            }
        }

        if (req.file) {
            req.body.image = req.file.filename
        } else {
            req.body.image = edituser.image
        }

        const data = await User.findByIdAndUpdate(req.query.id, req.body)
        res.status(200).json({ success: true, message: 'User updated successfully.', data })

    } catch (error) {
        res.status(400).json({ success: false, message: 'User updating error.', error })
    }
}


module.exports.deleteUser = async (req, res) => {
    try {

        const deleteuser = await User.findById(req.query.id)
        if (deleteuser.image) {
            const oldImage = path.join(__dirname, '../Images/user/', deleteuser.image)
            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage)
            }
        }

        const data = await User.findByIdAndDelete(req.query.id)
        res.status(203).json({ success: true, message: 'User deleted successfully.', data })

    } catch (error) {
        res.status(400).json({ success: false, message: 'User deleting error', error })
    }
}


module.exports.reGenerateAccessToken = async (req, res) => {
    const { refreshToken } = req.body
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token required.' })
    }
    try {
        const decode = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decode.id);
        if (!user) {
            return res.status(403).json({ success: false, message: 'Invalid refresh token.' });
        }

        const accessToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );

        const newRefreshToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
        );

        res.json({ success: true, accessToken: accessToken, refreshToken: newRefreshToken })

    } catch (error) {
        res.status(403).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
}

module.exports.userListWithLastChat = async (req, res) => {
    try {
        const loggedInUserId = new mongoose.Types.ObjectId(req.user.id);

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: loggedInUserId }
                }
            },
            {
                $lookup: {
                    from: 'chats',
                    let: { otherUserId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ['$sender_Id', '$$otherUserId'] },
                                                { $eq: ['$reciever_Id', loggedInUserId] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: ['$sender_Id', loggedInUserId] },
                                                { $eq: ['$reciever_Id', '$$otherUserId'] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'lastChat'
                }
            },
            {
                $lookup: {
                    from: 'chats',
                    let: { otherUserId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$sender_Id', '$$otherUserId'] },
                                        { $eq: ['$reciever_Id', loggedInUserId] },
                                        { $ne: ['$status', 'seen'] }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'unreadInfo'
                }
            },
            {
                $addFields: {
                    hasChat: { $gt: [{ $size: '$lastChat' }, 0] },
                    unreadCount: {
                        $ifNull: [{ $arrayElemAt: ['$unreadInfo.count', 0] }, 0]
                    },
                    lastMessage: {
                        $cond: [
                            { $ifNull: [{ $arrayElemAt: ['$lastChat.message', 0] }, false] },
                            { $arrayElemAt: ['$lastChat.message', 0] },
                            {
                                $cond: [
                                    { $ifNull: [{ $arrayElemAt: ['$lastChat.image', 0] }, false] },
                                    '📷 Photo',
                                    null
                                ]
                            }
                        ]
                    },
                    lastMessageTime: {
                        $ifNull: [{ $arrayElemAt: ['$lastChat.createdAt', 0] }, null]
                    }
                }
            },
            {
                $project: {
                    password: 0,
                    refreshToken: 0,
                    lastChat: 0,
                    unreadInfo: 0
                }
            },
            {
                $sort: {
                    hasChat: -1,
                    lastMessageTime: -1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error loading users",
            error: error.message
        });
    }
}