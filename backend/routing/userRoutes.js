const express = require('express')
const router = express.Router()
const userCTL = require('../controllers/userController')
const multer = require('multer')
const User = require('../model/userSchema')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'Images/user')
    },
    filename: function (req, file, cb){
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({storage: storage}).single('image')

router.get('/', userCTL.allUser)
router.post('/adduser', upload, userCTL.addUser)
router.post('/edituser', userCTL.editUser)
router.put('/edit', upload, userCTL.edit)
router.delete('/delete', upload, userCTL.deleteUser)




module.exports = router