const express = require("express")
const router = express.Router()
const chatCTL = require("../controllers/chatController")
const multer = require('multer')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'Images/chatImage')
    },
    filename: function (req, file, cb){
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({storage: storage}).single('image')

router.get('/getmessage' ,chatCTL.getChat)
router.post('/sendmessage', upload, chatCTL.sendChat)
router.delete('/deletemessages', upload ,chatCTL.deleteMessage)

module.exports = router