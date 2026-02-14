const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    firstname: {
        type: String,
        require: true
    },
    lastname: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    phone: {
        type: Number,
        require: true
    },
    password: {
        type: String,
        require: true,
        unique: true
    },
    image: {
        type: String,
        require: true
    },
    is_online: {
        type: Boolean,
        default: false
    },
    last_seen: {
        type: Number
    }

}, { timestamps: true })

const User = mongoose.model('User', userSchema)

module.exports = User