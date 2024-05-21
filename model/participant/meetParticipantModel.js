import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../utils/time.js";

const date = getisotime(DateTime);

const meetParticipantSchema = new mongoose.Schema({
    meet_id: { type: String, required: true },
    meet_admin_id: { type: String, required: true },   // user id of who created the meet/ meetAdmin
    participant_id: { type: String, required: true },
    invite_status: { type: Number, default: 3 },
    meet_join_status: { type: Number, default: 15 },
    travel_status: { type: Number, default: 9 },
    isAdmin: { type: Boolean, default: false },
    location_cord: {
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
    last_location: { type: String }
    ,

    created_at: { type: String, default: date },
    updated_at: { type: String, default: date },
    updated_by: { type: String }

});


meetParticipantSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const meetParticipant = mongoose.model("meet_participant", meetParticipantSchema);
export default meetParticipant
