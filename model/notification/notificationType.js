import { DateTime } from "luxon";
import mongoose from "mongoose";


const notificationtypeSchema = new mongoose.Schema({
    type_id: { type: Number, required: true },
    name: { type: String, required: true },
    created_at: { type: String, default: DateTime.now().toUTC().toISO() }
});
const notification_type = mongoose.model("notification_type", notificationtypeSchema);
export default notification_type
