const mongoose = require('mongoose')
require('dotenv').config()


mongoose.connect(process.env.DB_CONNECTION_STRING)
const db = mongoose.connection;

db.once('open', (err)=> {
    if(err){
        console.log('Database connection error.',err)
    }else{
        console.log('Database connected successfully.')
    }
})

module.exports = db