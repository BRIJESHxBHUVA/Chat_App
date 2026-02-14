const express = require("express")
const router = express.Router()
const chatCTL = require("../controllers/chatController")
const multer = require('multer')
const verifyAccessToken = require('../auth/authMiddleware.js')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Images/chatImage')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Images/chatFiles')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage }).single('image')
const uploadFile = multer({ storage: fileStorage }).single('file')

router.get('/getmessage', verifyAccessToken, chatCTL.getChat);
router.post('/sendmessage', upload, verifyAccessToken, chatCTL.sendChat);
router.delete('/deletemessages', upload, verifyAccessToken, chatCTL.deleteMessage);
router.post('/upload', verifyAccessToken, uploadFile, chatCTL.uploadFile);
router.post('/forward', verifyAccessToken, chatCTL.forwardMessages);

module.exports = router