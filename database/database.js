import mongoose from "mongoose";
import { } from "dotenv/config";
import { log } from "../index.js";

const MONGODB_URL = process.env.MONGODB_URL

const connect = async () => {
    try {
        await mongoose.connect(MONGODB_URL)
        log.info(`MongoDB connected`)
        console.log("MongoDB connected");
    } catch (error) {
        console.log("Not Connected", error);
        log.error(`MongoDB Not Connected ${error}`)
    }
}

export default connect 
