import mongoose from 'mongoose'

const connectDb = async()=>{
    const url = process.env.MONGO_URI;
    if(!url){
        throw new Error("Mongo URI Abscent");
    }

    try {
        await mongoose.connect(url, {
            "dbName": "ChatApp"
        })
        console.log("Connection to DB Successful");
    } catch (error) {
        console.log(console.error("Connection to MONGODB failed", error));
        process.exit(1);
    }
}


export default connectDb;