import { DateTime } from "luxon";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    email_verified: { type: Boolean, default: false },
    email_verified_at: { type: String },
    address: { type: String },
    photo: { type: String},
    status: { type: Number, default: 1 },
    address_cord: {
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
    phone: { type: String },
    country_code: { type: String },
    calling_code: { type: String },
    gender: { type: String },
    isLoggedIn: { type: Boolean },
    verification_code: { type: String },
    changed_fields: [String],
    created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_at: { type: String, default: DateTime.now().toUTC().toISO() },
    log_created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_by: { type: String },
});

userSchema.pre("save", function setDatetime(next) {
    this.log_created_at = DateTime.now().toUTC().toISO()
    next()
})

const userModelLog = mongoose.model("user_log", userSchema);
export default userModelLog