import { DateTime } from "luxon";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    email_verified: { type: Boolean, default: false },
    email_verified_at: { type: String },
    address: { type: String, default: "" },
    photo: { type: String,default:"" },
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
    phone: { type: String, default: "" },
    country_code: { type: String },
    calling_code: { type: String },
    gender: { type: String, default: "" },
    isLoggedIn: { type: Boolean, default: false },
    verification_code: { type: String },
    created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_by: { type: String },
});

userSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const userModel = mongoose.model("user", userSchema);
export default userModel
