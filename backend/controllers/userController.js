const User = require('../model/userSchema')
const path = require('path')
const fs = require('fs')


module.exports.allUser = async (req, res)=> {
    try {
        const data = await User.find({})
        if(data.length <= 0){
           return res.status(404).json({success: false, message: 'User not found.'})
        }
        res.status(200).json({success: true, message: 'Users getting successfully.', data})

    } catch (error) {
        res.status(400).json({success: false, message: 'Users getting error', error})
    }
}


module.exports.loginUser = async (req, res)=> {
    try {
        
        const data = await User.findOne({email: req.body.email})

        if(data){
            if(req.body.password === data.password){
                res.status(200).json({success: true, message: 'Login successfully.', data})
            }else{
                res.status(400).json({success: false, message: 'Invalid password.'})
            }
        }else{
            res.status(404).json({success: false, message: 'Invalid email address.'})
        }

    } catch (error) {
        res.status(400).json({success: false, message: 'User login error.', error})
    }
}


module.exports.addUser = async (req, res)=> {
    try {

         const existUser = await User.findOne({email: req.body.email})
        if(existUser){
            return res.status(400).json({success: false, message: 'User email already exists.'})
        }

            if(req.file){
                req.body.image = req.file.filename 
            }
            const data = await User.create(req.body)
            res.status(201).json({success: true, message: 'User regestration successfully.', data})


    } catch (error) {
        res.status(400).json({success: false, message: 'User regestration error', error})
    }
}


module.exports.editUser = async (req, res)=> {
    try {

        const data = await User.findById(req.query.id)
        res.status(200).json({success: true, message: 'User edit data get successfully.', data})

    } catch (error) {
        res.status(400).json({success: false, message: 'User editing error', error})
    }
}


module.exports.edit = async (req, res)=> {
    try {

        const edituser = await User.findById(req.query.id)
        if(edituser.image){
            const oldImage = path.join(__dirname,'../Images/user/', edituser.image)
            if(fs.existsSync(oldImage)){
                fs.unlinkSync(oldImage)
            }
        }

        if(req.file){
            req.body.image = req.file.filename
        }else{
            req.body.image = edituser.image
        }

        const data = await User.findByIdAndUpdate(req.query.id, req.body)
        res.status(200).json({success: true, message: 'User updated successfully.', data})

    } catch (error) {
        res.status(400).json({success: false, message: 'User updating error.',error})
    }
}


module.exports.deleteUser = async (req, res)=> {
    try {

        const deleteuser = await User.findById(req.query.id)
        if(deleteuser.image){
            const oldImage = path.join(__dirname, '../Images/user/', deleteuser.image)
            if(fs.existsSync(oldImage)){
                fs.unlinkSync(oldImage)
            }
        }

        const data = await User.findByIdAndDelete(req.query.id)
        res.status(203).json({success: true, message: 'User deleted successfully.', data})

    } catch (error) {
        res.status(400).json({success: false, message: 'User deleting error', error})
    }
}