import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../utils/time.js";


let date = getisotime(DateTime)


const supportSchema = new mongoose.Schema({
    status_type_id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    url: [String],
    supportEmail: [String],
    created_at: { type: String, default: date },
    updated_at: { type: String, default: date },
    updated_by: { type: String}
})

supportSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const supportModel = mongoose.model('support', supportSchema);
export default supportModel;
