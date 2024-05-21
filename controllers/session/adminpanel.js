import userModel from "../../model/user/userModel.js";
import jwt from "jsonwebtoken";
import { } from "dotenv/config";
import adminModel from "../../model/adminpanel/adminModel.js";
import bcrypt from "bcryptjs"
import userModelLog from "../../model/log/userModelLog.js";
import getisotime from "../../utils/time.js";
import { DateTime } from "luxon";
import meet from "../../model/meet/meetModel.js";
import meetParticipant from "../../model/participant/meetParticipantModel.js";
import notification_admin from "../../model/notification/adminNotificationModel.js";
import notificationtoken from "../../model/notification/notificationTokenModel.js";
import notification from "../../model/notification/notificationModel.js";
import notify from "../../utils/notify.js";



const adminsignin = async (req, res) => {

    let { email, password } = req.body
    let secret = process.env.DB_AUTH_SECRET

    try {
        const user = await adminModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" });
        }


        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        let token
        if (user) {
            token = jwt.sign({ email: user.email }, secret);
        }

        res.status(200).json({ message: "Admin signin successfully", user, token })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })

    }
}

export const adminsignup = async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    // let secret = process.env.DB_AUTH_SECRET
    let result
    try {

        const oldUser = await adminModel.findOne({ email });

        if (oldUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 12);

        result = await adminModel.create({
            first_name,
            last_name,
            email,
            password: hashedPassword,

        });
        res.status(201).json({ result: result })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });

    }

}

export const getallusersforadmin = async (req, res) => {
    let { resultsPerPage } = req.body

    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1

    try {

        let users = await userModel.find({}).select({ photo: 0 }).sort({ created_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)

        let usersCount = await userModel.find({}).countDocuments()
        let userdetails = []
        let updated_by = ""

        for (let u of users) {
            if (u.updated_by) {

                updated_by = await userModel.findById(u.updated_by)
                if (!updated_by) {
                    updated_by = await adminModel.findById(u.updated_by)
                    if (updated_by) {
                        updated_by = { ...updated_by._doc, name: `${updated_by.first_name} ${updated_by.last_name}` }
                    } else {
                        updated_by = ""
                    }
                }
            } else {
                updated_by = ""
            }
            userdetails.push({ ...u._doc, updated_by: updated_by ? updated_by.name : "" })
        }

        res.status(200).json({ allusers: userdetails, usersCount })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
}

export const getuserhistory = async (req, res) => {
    let { id, resultsPerPage } = req.body

    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1


    try {
        let user = await userModelLog.find({ user_id: id }).sort({ updated_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
        let userhistoryCount = await userModelLog.find({ user_id: id }).countDocuments()
        let userdetails = []
        let updated_by = ""


        for (let u of user) {
            if (u.updated_by) {
                updated_by = await userModel.findById(u.updated_by)

                if (!updated_by) {
                    updated_by = await adminModel.findById(u.updated_by)
                    if (updated_by) {
                        updated_by = { ...updated_by._doc, name: `${updated_by.first_name} ${updated_by.last_name}` }
                    } else {
                        updated_by = ""
                    }
                }
            } else {
                updated_by = ""
            }
            userdetails.push({ ...u._doc, updated_by: updated_by ? updated_by.name : "" })
        }
        res.json({ user: userdetails, userhistoryCount })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export const getallmeetforadmin = async (req, res) => {
    let { resultsPerPage } = req.body

    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1
    try {
        let allmeetdoc = await meet.find({}).select({ location_photo: 0 }).sort({ created_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
        let allmeetCount = await meet.find({}).countDocuments()

        let meetdetails = []
        let userdoc
        let allparticipants = []
        let participantdoc
        let updated_by = ""
        let participants

        for (let meet of allmeetdoc) {

            participants = await meetParticipant.find({ meet_id: meet._id, meet_join_status: 12, isAdmin: false })
            if (meet.updated_by) {
                updated_by = await userModel.findById(meet.updated_by).select({ photo: 0 })


                if (!updated_by) {
                    updated_by = await adminModel.findById(u.updated_by)
                    if (updated_by) {
                        updated_by = { ...updated_by._doc, name: `${updated_by.first_name} ${updated_by.last_name}` }
                    } else {
                        updated_by = ""
                    }
                }


            } else {
                updated_by = ""
            }
            userdoc = await userModel.findById(meet.user_id).select({ photo: 0 })
            allparticipants = []
            for (let mp of participants) {
                participantdoc = await userModel.findById(mp.participant_id).select({ photo: 0 })
                if (participantdoc) {
                    allparticipants.push({ ...participantdoc._doc })
                }
            }
            meetdetails.push({ ...meet._doc, meetLocation: meet.location_photo, updated_by: updated_by ? updated_by.name : "", name: userdoc.name, email: userdoc.email, address: userdoc.address, phone: userdoc.phone, allparticipant: allparticipants, calling_code: userdoc.calling_code, country_code: userdoc.country_code })
        }

        res.status(200).json({ result: meetdetails, allmeetCount })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet getsinglemeet - ${FILENAME} , path - ${PATH} `)
    }
}

// export const getmeethistory = async (req, res) => {
//     let { id, resultsPerPage } = req.body


//     let page = req.params.page >= 1 ? req.params.page : 1;
//     page = page - 1


//     try {
//         let meet = await meetLog.find({ user_id: id }).sort({ created_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
//         let meetHistoryCount = await meetLog.find({ user_id: id }).countDocuments()

//         let user = await userModel.findById(id)
//         let meetdetails = []


//         let updated_by = ""


//         for (let u of user) {
//             if (u.updated_by) {
//                 updated_by = await userModel.findById(u.updated_by)
//                 if (!updated_by) {
//                     updated_by = await adminModel.findById(u.updated_by)
//                     if (updated_by) {
//                         updated_by = { ...updated_by._doc, name: `${updated_by.first_name} ${updated_by.last_name}` }
//                     } else {
//                         updated_by = ""
//                     }
//                 }
//             } else {
//                 updated_by = ""
//             }
//             meetdetails.push({ ...u._doc, updated_by: updated_by ? updated_by.name : "" })
//         }
//         res.json({ meet: meetdetails, meetHistoryCount })

//     } catch (error) {
//         res.status(404).json({ message: "Something went wrong" + error });
//     }
// }

export const updateuserstatus = async (req, res) => {
    let { id, status, updated_by } = req.body

    let date = getisotime(DateTime)
    try {

        let updatedStatus = await userModel.findById(id)

        if (updatedStatus.status != status) {
            let updatedStatus = await userModel.findByIdAndUpdate(id, { status: status, updated_at: date, updated_by }, { new: true })

            let { _id, ...statusUpdated } = updatedStatus._doc
            await userModelLog.create({
                user_id: id,
                ...statusUpdated,
                changed_fields: ["status"]
            })
        }

        res.status(200).json({ message: "Status Update successfully" });
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }

}

export const adminsearchuser = async (req, res) => {
    let { searchTerm, resultsPerPage } = req.body

    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1

    try {
        let pattern = new RegExp(searchTerm, 'i')
        let result = await userModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }, { email: { $regex: pattern } }, { phone: { $regex: pattern } }, { address: { $regex: pattern } }] }] }).select({ photo: 0 }).sort({ created_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
        let searchCount = await userModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }, { email: { $regex: pattern } }, { phone: { $regex: pattern } }, { address: { $regex: pattern } }] }] }).countDocuments()


        let upui
        let doc
        let resp = []

        for (let u of result) {

            if (u.updated_by) {
                upui = await userModel.findById(u.updated_by)
                if (upui) {
                    doc = { ...u._doc, updated_by: `${upui.name} ` }
                } else {
                    upui = await adminModel.findById(u.updated_by)
                    if (upui) {
                        doc = { ...u._doc, updated_by: `${upui.first_name} ${upui.last} ` }
                    } else {
                        doc = { ...u._doc, updated_by: " - " }
                    }

                }

            } else {
                doc = { ...u._doc, updated_by: " - " }
            }

            resp.push(doc)
        }
        res.status(201).json({ resp, searchCount })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export const adminsearchmeet = async (req, res) => {
    let { searchTerm, resultsPerPage } = req.body

    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1
    try {
        let pattern = new RegExp(searchTerm, 'i')
        let allmeetdoc = await meet.find({ $and: [{ $or: [{ title: { $regex: pattern } }, { topic: { $regex: pattern } }, { meet_location: { $regex: pattern } }] }] }).select({ location_photo: 0 }).sort({ created_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
        let allmeetCount = await meet.find({ $and: [{ $or: [{ title: { $regex: pattern } }, { topic: { $regex: pattern } }, { meet_location: { $regex: pattern } }] }] }).countDocuments()

        let meetdetails = []
        let userdoc
        let allparticipants = []
        let participantdoc
        let updated_by = ""
        let participants

        for (let meet of allmeetdoc) {

            participants = await meetParticipant.find({ meet_id: meet._id, meet_join_status: 12, isAdmin: false })
            if (meet.updated_by) {
                updated_by = await userModel.findById(meet.updated_by).select({ photo: 0 })


                if (!updated_by) {
                    updated_by = await adminModel.findById(u.updated_by)
                    if (updated_by) {
                        updated_by = { ...updated_by._doc, name: `${updated_by.first_name} ${updated_by.last_name}` }
                    } else {
                        updated_by = ""
                    }
                }

            } else {
                updated_by = ""
            }
            userdoc = await userModel.findById(meet.user_id).select({ photo: 0 })
            allparticipants = []
            for (let mp of participants) {
                participantdoc = await userModel.findById(mp.participant_id).select({ photo: 0 })
                if (participantdoc) {
                    allparticipants.push({ ...participantdoc._doc })
                }
            }
            meetdetails.push({ ...meet._doc, meetLocation: meet.location_photo, updated_by: updated_by ? updated_by.name : "", name: userdoc.name, email: userdoc.email, address: userdoc.address, phone: userdoc.phone, allparticipant: allparticipants, calling_code: userdoc.calling_code, country_code: userdoc.country_code })
        }

        res.status(200).json({ result: meetdetails, allmeetCount })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export const singleuserphoto = async (req, res) => {
    let { user_id } = req.body
    try {
        let userphoto = await userModel.findById(user_id)
        if (!userphoto) {
            return res.status(400).json({ message: "User doesn't exist" });

        }
        res.status(200).json({ singlePhoto: userphoto.photo })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
}

export const singlemeetlocationphoto = async (req, res) => {
    let { meet_id } = req.body
    try {
        let meetLocation = await meet.findById(meet_id)
        if (!meetLocation) {
            return res.status(400).json({ message: "Meet doesn't exist" });

        }
        res.status(200).json({ meetlocationphoto: meetLocation.location_photo })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
}


export const adminnotification = async (req, res) => {
    let { title, body } = req.body
    let date = getisotime(DateTime)
    try {

        let notificationtokendoc = await notificationtoken.find({})

        let admin_notify = await notification_admin.create({

            title,
            body,

        })

        let tokens = []
        let userIds = []
        notificationtokendoc.forEach(t => {
            if (t.isSignin) {
                tokens.push(t.token)
            }
            userIds.push(t.user_id)
        })
        let notifications_doc = { title, body, data: [], url: "", type_id: 111, created_at: date, updated_at: date }
        if (userIds.length) {
            let notify = await notification.updateMany({ user_id: { "$in": userIds } }, { "$push": { notifications: notifications_doc } })
        }
        if (tokens.length) {

            notify({ tokens, title, body, url: "", type_id: 111 })
        }

        res.status(200).json({ message: "Notification send" })
    } catch (error) {

        res.status(400).json({ message: "Something went wrong" + error });

    }
}


export const getadminnotification = async (req, res) => {
    let { resultsPerPage } = req.body

    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1
    try {
        let notifications = await notification_admin.find({}).sort({ updated_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
        let notificationsCount = await notification_admin.find({}).countDocuments()
        res.status(200).json({ notifications, notificationsCount })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export const getadminsearchnotification = async (req, res) => {
    let { searchTerm, resultsPerPage } = req.body

    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1
    try {
        let pattern = new RegExp(searchTerm, 'i')
        let searchnotification = await notification_admin.find({ $and: [{ $or: [{ title: { $regex: pattern } }, { body: { $regex: pattern } }] }] }).sort({ updated_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
        let notificationsearchCount = await notification_admin.find({ $and: [{ $or: [{ title: { $regex: pattern } }, { body: { $regex: pattern } }] }] }).countDocuments()
        res.status(200).json({ searchnotification, notificationsearchCount })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}


export const updatePassword = async(req,res)=>{
    let {newPassword,id} = req.body
    try {
        let user= await adminModel.findById(id)
         
        if(user){
                  
              const hashedPassword = await bcrypt.hash(newPassword,12)
              let adminuser = await adminModel.findByIdAndUpdate(id,{password:hashedPassword})
              res.status(200).json({message:"Password updated successfully"}) 

        }else{
            res.status(400).json({message:"User doesn't exist"})
        }

    } catch (error) {

        res.status(400).json({message:"Something went wrong "+ error})
        
    }
}


export const updateAdminUser = async(req,res)=>{
    
    let {id,first_name,last_name,photo}=req.body
    try {
          let admin = await adminModel.findById(id)

          if(admin){
    
            let user = await adminModel.findByIdAndUpdate(id,{first_name,last_name})

            res.status(200).json({message:"Profile updated successfully"})


          }else{
            res.status(400).json({message:"User doesn't exist"})
          }
    } catch (error) {


        res.status(400).json({message:"Something went wrong "+error})
        
    }
}

export const getTotalUsers = async(req,res)=>{
    try {
        let users = await userModel.find({}).countDocuments()

        res.status(200).json({totalUsers:users})

    } catch (error) {
        
    }
}
export const getTotalActiveUsers = async(req,res)=>{
    try {
        let users = await userModel.find({isLoggedIn:true}).countDocuments()

        res.status(200).json({totalActiveUsers:users})

    } catch (error) {
        
    }
}
export const getTotalMeets = async(req,res)=>{
    try {
        let meets = await meet.find({}).countDocuments()

        res.status(200).json({totalMeets:meets})

    } catch (error) {
        
    }
}

export const getStats = async(req,res)=>{
    try {
        let  currentYear  = DateTime.now().year
        let month=""
        let regexp
        let ucount,mcount
        let users=[]
        let meets=[]
        for(let i =1;i<=12;i++){
    if(i<=9){
       month="0"+i
    }else{
        month=""+i
    }
    regexp = new RegExp(currentYear+"-"+month+".*","i")

ucount = await userModel.find({created_at:{$regex:regexp}}).countDocuments()
mcount = await meet.find({created_at:{$regex:regexp}}).countDocuments()


users.push(ucount)

meets.push(mcount)



        }

        res.status(200).json({stats:{users,meets}})

    } catch (error) {
        res.status(400).json({message:"Something went wrong "+error})
    }
}


export default adminsignin
