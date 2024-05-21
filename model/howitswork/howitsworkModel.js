import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../utils/time.js";


let date = getisotime(DateTime)


const howitsworkSchema = new mongoose.Schema({
    status_type_id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    videoData: [{
        videoTitle: { type: String, required: true },
        videoDescription: { type: String },
        videoURL: { type: String, required: true },
    }],
    created_at: { type: String, default: date },
    updated_at: { type: String, default: date },
    updated_by: { type: String }
})

howitsworkSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})




const howitswork = mongoose.model('howitswork', howitsworkSchema);
export default howitswork;
