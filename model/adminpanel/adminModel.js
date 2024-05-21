import { DateTime } from "luxon";
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    user_type_id: { type: Number, default: 1 },
    email: { type: String, required: true },
    first_name: { type: String },
    last_name: { type: String },
    password: { type: String },
    created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_at: { type: String, default: DateTime.now().toUTC().toISO() },
});

adminSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const adminModel = mongoose.model("admin_panel", adminSchema);
export default adminModel
