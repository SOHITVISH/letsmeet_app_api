import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../utils/time.js";


let date = getisotime(DateTime)


const chatSchema = new mongoose.Schema({
    users: [String],
    meet_id: { type: String, required: true },
    meet_admin: { type: String, required: true },
    users_left_meet: [String],
    admin_removed_users: [String],
    active_users: [String],
    messages: [
        {

            user_id: { type: String, required: true },
            message_type: { type: Number, default: 16 },
            message: { type: String, required: true },
            received_by: [String],
            seen_by: [String],
            isDeleted: { type: Boolean, default: false },
            invisible_to: [String],
            created_at: { type: String, default: date },
            updated_at: { type: String, default: date }
        }
    ],
    created_at: { type: String, default: date },
    updated_at: { type: String, default: date }
})

chatSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})




const chat = mongoose.model('chat', chatSchema);
export default chat;
