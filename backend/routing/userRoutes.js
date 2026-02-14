const express = require('express')
const router = express.Router()
const userCTL = require('../controllers/userController')
const multer = require('multer')
const verifyAccessToken = require('../auth/authMiddleware.js')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Images/user')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage }).single('image')

router.get('/', verifyAccessToken, userCTL.allUser);
router.get('/list-with-last-chat', verifyAccessToken, userCTL.userListWithLastChat);
router.post('/login', userCTL.loginUser);
router.post('/adduser', upload, verifyAccessToken, userCTL.addUser);
router.post('/edituser', verifyAccessToken,  userCTL.editUser);
router.put('/edit', upload, verifyAccessToken, userCTL.edit);
router.delete('/delete', upload, verifyAccessToken, userCTL.deleteUser);
router.post('/regeneratetoken', userCTL.reGenerateAccessToken);




module.exports = router