import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../utils/time.js";

const date = getisotime(DateTime);

const meetSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    title: { type: String, required: true },
    participants: [String],
    topic: { type: String },
    meet_date: { type: String, required: true },
    meet_location: { type: String, required: true },
    meet_time: { type: String, required: true },
    meet_status: { type: Number, default: 5 },
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
    location_photo: { type: String,default:"" },
    created_at: { type: String, default: date },
    updated_at: { type: String, default: date },
    updated_by: { type: String },
    expire_at: { type: String }


});


meetSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const meet = mongoose.model("meet", meetSchema);
export default meet
