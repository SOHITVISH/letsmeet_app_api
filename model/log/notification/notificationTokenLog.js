import mongoose from "mongoose";
import { DateTime } from "luxon";

const notificationSchema = new mongoose.Schema({
    user_id: { type: String },
    isSignin: { type: Boolean },
    token: { type: String },
    updated_at: { type: String },
    log_created_at: { type: String, default: DateTime.now().toUTC().toISO() },
})


notificationSchema.pre("save", function setDatetime(next) {
    this.log_created_at = DateTime.now().toUTC().toISO()
    next()
})

const notificationtokenlog = mongoose.model("notificationtokenlog", notificationSchema);
export default notificationtokenlog