import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../utils/time.js";

const date = getisotime(DateTime);

const meetActivitySchema = new mongoose.Schema({

    meet_id: { type: String, required: true },
    activity_name: { type: String, required: true },
    activity_description: { type: String, required: true },
    created_at: { type: String, default: date },
    updated_at: { type: String, default: date },
});


meetActivitySchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const meetActivityLog = mongoose.model("meet_activity_log", meetActivitySchema);
export default meetActivityLog
