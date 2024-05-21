import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../../utils/time.js";


const date = getisotime(DateTime);

const participantLogSchema = new mongoose.Schema({
    meet_id: { type: String, required: true },
    participant_doc_id: { type: String, required: true },
    meet_admin_id: { type: String, required: true },   // user id of who created the meet/ meetAdmin
    participant_id: { type: String, required: true },
    invite_status: { type: Number },
    meet_join_status: { type: Number },
    travel_status: { type: Number },
    isAdmin:{type:Boolean},
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
last_location:{type:String}
    ,
    changed_fields: [String],
    created_at: { type: String },
    updated_at: { type: String },
    updated_by: { type: String },
    log_created_at: { type: String, default: date },
});


participantLogSchema.pre("save", function setDatetime(next) {

    this.log_created_at = DateTime.now().toUTC().toISO()

    next()
})

const meetParticipantLog = mongoose.model("meet_participant_log", participantLogSchema);
export default meetParticipantLog
