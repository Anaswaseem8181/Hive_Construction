const mongoose = require("mongoose")
const dotenv = require("dotenv")

dotenv.config()

const ConnectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("mongo connected");
        
    } catch (error) {
        console.error("not connected", error)
        process.exit(1);        
    }
    
}

module.exports = ConnectDB