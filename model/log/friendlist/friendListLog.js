import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../../utils/time.js";


const date = getisotime(DateTime);

const friendSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    friendIds: [String],
    created_at: { type: String, default: date },
    updated_at: { type: String, default: date },
    log_created_at: { type: String }

});


friendSchema.pre("save", function setDatetime(next) {
    this.log_created_at = DateTime.now().toUTC().toISO()
    next()
})



const friendListLog = mongoose.model("friend_list_log", friendSchema);
export default friendListLog
