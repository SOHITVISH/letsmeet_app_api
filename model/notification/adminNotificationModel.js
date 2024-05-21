import mongoose from "mongoose";
import { DateTime } from "luxon";
import getisotime from "../../utils/time.js";


let date = getisotime(DateTime)

const notificationadminSchema = new mongoose.Schema({
    // recipient_type: { type: Number, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    // type_id: { type: Number, required: true },
    updated_at: { type: String, default: date }
})


notificationadminSchema.pre("save", function setDatetime(next) {
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const notification_admin = mongoose.model("notification_admin", notificationadminSchema);
export default notification_admin