import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../utils/time.js";

const date = getisotime(DateTime);

const meetConfigSchema = new mongoose.Schema({
    member_limit: { type: Number, default: 10 },
    created_at: { type: String, default: date },
    updated_at: { type: String, default: date }


});


meetConfigSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const meet_config = mongoose.model("meet_config", meetConfigSchema);
export default meet_config
