import { DateTime } from "luxon";
import mongoose from "mongoose";

const date = new Date();

const statusSchema = new mongoose.Schema({

  status_type_id: { type: Number, required: true },
  status_type: { type: String, required: true },
  created_at: { type: String, default: DateTime.now().toUTC().toISO() }

});
const statusType = mongoose.model("status_type", statusSchema);
export default statusType
