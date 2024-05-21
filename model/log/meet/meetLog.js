import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../../utils/time.js";

const date = getisotime(DateTime);

const meetSchema = new mongoose.Schema({
    meet_id: { type: String, required: true },
    user_id: { type: String, required: true },
    title: { type: String, required: true },
    participants: [String],
    topic: { type: String },
    meet_date: { type: String, required: true },
    meet_location: { type: String, required: true },
    meet_status: { type: Number},
    meet_time: { type: String },
    changed_fields:[String],
    meet_location_cord: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    location_photo: { type: String },
    created_at: { type: String, default: date },
    updated_at: { type: String, default: date },
    expire_at: { type: String},
    updated_by: { type: String },
    log_created_at: { type: String, default: date }


});

meetSchema.pre("save", function setDatetime(next) {
    this.log_created_at = DateTime.now().toUTC().toISO()
    next()
})

const meetLog = mongoose.model("meet_log", meetSchema);
export default meetLog
