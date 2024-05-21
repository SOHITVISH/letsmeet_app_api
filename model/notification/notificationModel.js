import mongoose from "mongoose";
import { DateTime } from "luxon"
import getisotime from "../../utils/time.js";


let date = getisotime(DateTime)

const NotificationSchema = new mongoose.Schema({
    user_id: { type: String },
    notifications: [
        {
            title: { type: String },
            body: { type: String },
            url: { type: String },
            data: [String],
            type_id: { type: Number },
            visited: { type: Boolean, default: false },
            seen: { type: Boolean, default: false },
            created_at: { type: String, default: date },
            updated_at: { type: String, default: date }
        }],
    updated_at: { type: String, default: date }
});

NotificationSchema.pre("save", function setDatetime(next) {
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})
NotificationSchema.pre("insertMany", function setDatetime(next) {
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})
NotificationSchema.pre("updateMany", function setDatetime(next) {
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})
NotificationSchema.pre("findOneAndUpdate", function setDatetime(next) {
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const notification = mongoose.model("notification", NotificationSchema);
export default notification