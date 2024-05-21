import mongoose from "mongoose";
import { DateTime } from "luxon";

const notificationSchema = new mongoose.Schema({
    user_id: { type: String },
    isSignin: { type: Boolean, default: true },
    token: { type: String },
    updated_at: { type: String, default: DateTime.now().toUTC().toISO() }
})


notificationSchema.pre("save", function setDatetime(next) {
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const notificationtoken = mongoose.model("notificationtoken", notificationSchema);
export default notificationtoken