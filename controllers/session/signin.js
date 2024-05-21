import userModel from "../../model/user/userModel.js";
import jwt from "jsonwebtoken";
import { } from "dotenv/config";
import MailSendCustomer from "../email/email.js";
import userModelLog from "../../model/log/userModelLog.js";
import { log } from "../../index.js";
import getisotime from "../../utils/time.js";
import { DateTime } from "luxon";
import bcrypt from "bcryptjs"

const signin = async (req, res) => {

    let { email } = req.body
    let secret = process.env.DB_AUTH_SECRET
    let date = getisotime(DateTime)
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" });
        }
        if (user.status != 1) {
            return res.status(400).json({ message: "Access denied" });
        }

    
        let code = ""
        code = String(parseInt(Math.abs(Math.random() * 100000)))

        if (code.length < 5) {
            let i = 2
            while (code.length < 5) {
                code = code + "" + i
                i++
            }
        }

        var sendMail = {
            from: `PlanNmeet ${process.env.SENDER_EMAIL}`,
            to: req.body.email,
            subject: "Verification code",
            template: "sendEmail",
            context: {
                code,
            }
        };
        MailSendCustomer(sendMail)
        const hashedCode = await bcrypt.hash(code, 12)
        let updated = await userModel.findByIdAndUpdate(user._id, { verification_code: hashedCode, updated_at: date, updated_by: user._id.toString() }, { new: true })

        // let updateduser = await userModel.findById(user._id)
        let { _id, ...userupdated } = updated._doc
        await userModelLog.create({
            user_id: updated._id,
            ...userupdated
        })


        log.info(`${user.email} signin successfully`)
        res.status(200).json({ message: "Signin successfully & verification code generated" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`User signin failed ${error}`)
    }
}

export default signin