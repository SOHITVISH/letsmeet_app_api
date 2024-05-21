import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../utils/time.js";

const date = getisotime(DateTime);

const friendSchema = new mongoose.Schema({
    user_id: { type: String, required: true },  
    friendIds: [String],
    created_at: { type: String, default: date },
    updated_at: { type: String, default: date }
});


friendSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})



const friendList = mongoose.model("friend_list", friendSchema);
export default friendList
