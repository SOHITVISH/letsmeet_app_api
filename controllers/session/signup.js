import { DateTime } from "luxon";
import userModel from "../../model/user/userModel.js";
import getisotime from "../../utils/time.js";
import MailSendCustomer from "../email/email.js";
import userModelLog from "../../model/log/userModelLog.js";
import jwt from "jsonwebtoken"
import { log } from "../../index.js";

import friendList from "../../model/friendlist/friendListModel.js";

import friendListLog from "../../model/log/friendlist/friendListLog.js";
import meet from "../../model/meet/meetModel.js";
import bcrypt from "bcryptjs"
import adminModel from "../../model/adminpanel/adminModel.js";
import notification from "../../model/notification/notificationModel.js";

let secret = process.env.DB_AUTH_SECRET

const signup = async (req, res) => {
    let { email, name } = req.body
let date = getisotime(DateTime)
    try {

        const oldUser = await userModel.findOne({ email });
        if (oldUser) {
            return res.status(400).json({ message: "User already exists" });
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

        // let token = jwt.sign({ email }, secret);

        let hashedCode = await bcrypt.hash(code, 12)
        let result = await userModel.create({
            name,
            email,
            address: "",
            address_cord: { type: 'Point', coordinates: [0, 0] },
            verification_code: hashedCode

        });

        let friend_list = await friendList.create({
            user_id: result._id,
            friendIds: []
        })



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

        let updateduser = await userModel.findById(result._id)
        let { _id, ...userupdated } = updateduser._doc
        await userModelLog.create({
            user_id: updateduser._id,
            ...userupdated
        })

        let { _id: ip, ...friendupdated } = friend_list._doc
        await friendListLog.create({
            user_id: result._id,
            ...friendupdated
        })


        let admin = await adminModel.findOne({ user_type_id: 1 })
   
        let panelurl
        let paneltitle
        let notifications_doc

        panelurl = "/users"
        paneltitle = "User signup successfully"

        if (admin) {
            notifications_doc = { title: paneltitle, body: `${name} has successfully signup`, url: panelurl, type_id: 113, created_at: date, updated_at: date }
            let notify = await notification.findOneAndUpdate({ user_id: admin._id }, { "$push": { notifications: notifications_doc } })

        }



        log.info(`${email} Signup successfully`)
        res.status(200).json({ message: "Signup successfully" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`${email} failed to signup ` + error)
    }
}

export const updateuser = async (req, res) => {
    let { id, phone, address, gender, address_cord, callingCode, countryCode } = req.body
    // country_code
    // calling_code
    let reqbody = req.body
    let changed_fields = []
    let updates = {}

    let date = getisotime(DateTime)
    try {

        const user = await userModel.findById(id);

        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" });
        }
        let location_cord_change = "Noty Changed"
        console.log(reqbody, "outside for loop");

        console.log("_______________");

        let fieldsinbody = {}
        for (let ef in reqbody) {
            fieldsinbody[ef] = 1

        }


        for (let field in userModel.schema.obj) {

            if (fieldsinbody[field]) {
                if (field == "address_cord") {
                    let cords = []
                    if (user[field]) {
                        let old_location_cord = user[field]
                        if (old_location_cord.coordinates[0] != Number(address_cord.longitude) || old_location_cord.coordinates[1] != Number(address_cord.latitude)) {
                            updates[field] = { type: 'Point', coordinates: [Number(address_cord.longitude), Number(address_cord.latitude)] }
                            changed_fields.push(field)
                            location_cord_change = "Previous cord change"
                        }
                    } else {
                        updates[field] = { type: 'Point', coordinates: [Number(address_cord.longitude), Number(address_cord.latitude)] }
                        changed_fields.push(field)
                        location_cord_change = "Newly added cord"
                    }

                }
                else if (user[field] != reqbody[field]) {
                    updates[field] = reqbody[field]
                    changed_fields.push(field)
                }
            }
        }

        console.log(location_cord_change, "______________________LOG");

        let updatedUser = await userModel.findByIdAndUpdate(id, { ...updates, updated_at: date, updated_by: id }, { new: true })

        let { _id, ...userupdated } = updatedUser._doc
        await userModelLog.create({
            user_id: updatedUser._id,
            ...userupdated,
            changed_fields
        })


        res.status(200).json({ message: "User update" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })

    }
}

export const verifyemailcode = async (req, res) => {
    const { email, code } = req.body
    let date = getisotime(DateTime)
    try {
        let useremail = await userModel.findOne({ email })
        if (!useremail) {
            return res.status(400).json({ message: "User doesn't exist" })
        }
        if (useremail) {
            // if (useremail.email_verified) {
            //     res.status(400).json({ message: "Email already verified" })
            // }


            let token = jwt.sign({ email }, secret);

            let isCodeCorrect = await bcrypt.compare(code, useremail.verification_code)

            if (isCodeCorrect) {
                let changed_fields = ["isLoggedIn"]
                if (useremail.email_verified) {
                    let userdoc = await userModel.findByIdAndUpdate(useremail._id, {
                        isLoggedIn: true,
                        updated_at: date,
                        updated_by: useremail._id.toString()
                    })

                } else {

                    let userdoc = await userModel.findByIdAndUpdate(useremail._id, {
                        email_verified: true,
                        email_verified_at: date,
                        updated_at: date,
                        isLoggedIn: true,
                        updated_by: useremail._id.toString()

                    });

                    changed_fields.push("email_verified", "email_verified_at")

                }

                let updateduser = await userModel.findById(useremail._id);
                let { _id, ...modifydata } = updateduser._doc
                await userModelLog.create({
                    user_id: updateduser._id,
                    ...modifydata,
                    changed_fields
                })


                res.status(200).json({ verified: true, message: "Email has been verified.", userData: updateduser, token })
            } else {
                res.status(400).json({ message: "Invalid verification code" })
            }



        } else {
            res.status(400).json({ message: "User doesn't exist" })

        }

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export const resendverificationcode = async (req, res) => {

    let { email } = req.body
    let secret = process.env.DB_AUTH_SECRET
    let date = getisotime(DateTime)
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" });
        }

        let code

        code = String(parseInt(Math.abs(Math.random() * 100000)))
        if (code.length == 4) {
            code = code + "0"
        }


        var sendMail = {
            from: `PlanNmeet ${process.env.SENDER_EMAIL}`,
            to: req.body.email,
            subject: "Resend verification code",
            template: "sendEmail",
            context: {
                code,
            }
        };
        MailSendCustomer(sendMail)
        let hashedCode = await bcrypt.hash(code, 12)
        let updated = await userModel.findByIdAndUpdate(user._id, { verification_code: hashedCode, updated_at: date, updated_by: user._id.toString() }, { new: true })


        let { _id, ...userupdated } = updated._doc
        await userModelLog.create({
            user_id: updated._id,
            ...userupdated,
            changed_fields: ["Verification_code"],
        })
        log.info(`Resend verification code successfully`)
        res.status(200).json({ message: "Signin successfully & verification code generated" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.info(`Resend verification code failed`)
    }
}

export const getsingleuser = async (req, res) => {
    let { id } = req.body
    try {

        let user = await userModel.findById(id)
        if (!user) {
            res.status(400).json({ message: "User doesn't exist" })
            return
        }

        if (user.status != 1) {
            return res.status(400).json({ message: "Access denied" });
        }


        res.status(200).json({ user })


    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
}

export const signout = async (req, res) => {
    let { user_id } = req.body
    let date = getisotime(DateTime)

    try {
        let loggedinstatus = await userModel.findByIdAndUpdate(user_id, { isLoggedIn: false, updated_at: date, updated_by: user_id }, { new: true })

        let { _id, ...modifystatus } = loggedinstatus._doc
        await userModelLog.create({
            user_id: loggedinstatus._id.toString(),
            ...modifystatus,
            changed_fields: ["isLoggedIn"]
        })
        log.info(`User signOut successfully`)
        res.status(200).json({ message: "SignOut Succesfully" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`User signOut failed`  + error)
    }
}



export default signup