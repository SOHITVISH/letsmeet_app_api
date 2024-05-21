import { DateTime } from "luxon"
import meetLog from "../../model/log/meet/meetLog.js"
import meet from "../../model/meet/meetModel.js"
import userModel from "../../model/user/userModel.js"
import getisotime from "../../utils/time.js"
import { log } from "../../index.js"
import meetParticipant from "../../model/participant/meetParticipantModel.js"
import meetParticipantLog from "../../model/log/participant/participantLog.js"
import notificationtoken from "../../model/notification/notificationTokenModel.js"
import notifysend from "../../utils/notify.js"
import friendList from "../../model/friendlist/friendListModel.js"
import friendListLog from "../../model/log/friendlist/friendListLog.js"
import notification from "../../model/notification/notificationModel.js"
import chat from "../../model/chat/chatModel.js"
import axios from "axios"
import meet_config from "../../model/meet/meetConfigModel.js"
import meetActivityLog from "../../model/meet/meetActivityLogModel.js"
import adminModel from "../../model/adminpanel/adminModel.js"


let FILENAME = `meet.js`
let PATH = `controllers/meet/meet.js`

const createmeet = async (req, res) => {

    let { user_id, title, topic, meet_date, meet_location_cord, meet_location, meet_time, selected_friends } = req.body
    let date = getisotime(DateTime)
    try {
        let user = await userModel.findById(user_id)
        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" })
        }
        let meetconfigdoc = await meet_config.findOne({}).sort({ created_at: -1 })

        if (selected_friends.length >= meetconfigdoc.member_limit) {
            return res.status(400).json({ message: `Participant member limit reached , maximum ${meetconfigdoc.member_limit - 1} can be added` })
        }

        let expire_at = DateTime.fromISO(meet_date).plus({ hours: 24 }).toUTC().toISO()

        let meetdoc = await meet.create({
            user_id,
            title,
            topic,
            meet_time,
            meet_date,
            expire_at,
            meet_location_cord: { type: 'Point', coordinates: [Number(meet_location_cord.longitude), Number(meet_location_cord.latitude)] },
            meet_location,
            updated_by: user_id
        })

        // addAdmin- who create meet
        let addAdmin = await meetParticipant.create({
            meet_id: meetdoc._id.toString(),
            meet_admin_id: user_id,
            participant_id: user_id,
            invite_status: 2,
            meet_join_status: 12,
            isAdmin: true,
            location_cord: { type: "Point", coordinates: [user.address_cord.coordinates[0], user.address_cord.coordinates[1]] },
            updated_by: user_id
        })

        let userchat = await chat.create({
            users: [user_id],
            meet_id: meetdoc._id.toString(),
            meet_admin: user_id,
            users_left_meet: [],
            admin_removed_users: [],
            active_users: [],
            messages: []
        })

        if (selected_friends.length) {
            let userdoc
            let addinmeet
            for (let id of selected_friends) {


                userdoc = await userModel.findById(id).select({ address_cord: 1 })
                if (userdoc) {
                    addinmeet = await meetParticipant.create({
                        meet_id: meetdoc._id.toString(),
                        meet_admin_id: user_id,
                        participant_id: id,
                        location_cord: { type: 'Point', coordinates: [userdoc.address_cord.coordinates[0], userdoc.address_cord.coordinates[1]] },
                        updated_by: user_id
                    })

                    let { _id: aid, ...addmeet } = addinmeet._doc
                    await meetParticipantLog.create({
                        participant_doc_id: addinmeet._id.toString(),
                        ...addmeet
                    })
                }
            }
        }

        let { _id, ...userupdated } = meetdoc._doc
        await meetLog.create({
            meet_id: meetdoc._id,
            ...userupdated
        })

        let { _id: aid, ...adminchanged } = addAdmin._doc
        await meetParticipantLog.create({
            participant_doc_id: addAdmin._id.toString(),
            ...adminchanged
        })

        if (selected_friends.length) {

            let notifytoken = await notificationtoken.find({ user_id: { $in: selected_friends }, isSignin: true, token: { $ne: "" } })
            let userdata = await userModel.findById(user_id)


            if (notifytoken.length && userdata) {
                let notifications_doc
                let tokens = notifytoken.map(t => {
                    return t.token
                })

                let name = userdata.name
                notifications_doc = { title: `${name} has invited you to a meet- ${title}`, body: `${title} - ${name} has invited you`, url: "HomeScreen", type_id: 108, data: [meetdoc._id.toString(), user_id], created_at: date, updated_at: date }
                let notify = await notification.updateMany({ user_id: { $in: selected_friends } }, { "$push": { notifications: notifications_doc }, updated_at: date })
                notifysend({ tokens, title: notifications_doc.title, body: notifications_doc.body, url: notifications_doc.url, type_id: notifications_doc.type_id })

            }

        }


        let admin = await adminModel.findOne({ user_type_id: 1 })

        let panelurl
        let paneltitle
        let notifications_doc

        panelurl = "/meets"
        paneltitle = "Meet created successfully"

        if (admin) {
            notifications_doc = { title: paneltitle, body: `${user.name}  has successfully created a meet through app - ${title}`, url: panelurl, type_id: 112, created_at: date, updated_at: date }
            let notify = await notification.findOneAndUpdate({ user_id: admin._id }, { "$push": { notifications: notifications_doc } })

        }

        log.info(`Meet created successfuly`)
        res.status(200).json({ message: "Meet Created", meet_id: meetdoc._id.toString() })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet`)
    }

}

export const updatemeet = async (req, res) => {
    let { meet_id } = req.body;
    let { user_id, title, topic, meet_date, meet_location_cord, meet_location, meet_time, selected_friends, newParticipant, removedParticipant } = req.body
    let date = getisotime(DateTime)
    try {

        let oldmeetdoc = await meet.findById(meet_id)
        let admindoc = await userModel.findById(user_id)
        if (!oldmeetdoc) {
            return res.status(400).json({ message: `No meet exist` });
        }

        let meetconfigdoc = await meet_config.findOne({}).sort({ created_at: -1 })
        let current_member = await meetParticipant.find({ meet_id, invite_status: { $in: [2, 3] }, isAdmin: false }).countDocuments()
        current_member = (current_member + newParticipant.length) - removedParticipant.length
        if (current_member >= meetconfigdoc.member_limit) {
            return res.status(400).json({ message: "Participant member limit reached" })
        }

        let updatedField = {}
        let reqbody = req.body
        let changed_fields = []
        let updatedmeet
        for (let field in meet.schema.obj) {

            if (reqbody[field]) {
                if (field != "meet_location_cord") {
                    if (oldmeetdoc[field] != reqbody[field]) {
                        updatedField[field] = reqbody[field]
                        changed_fields.push(field)

                        if (field == "meet_date") {
                            updatedField["expire_at"] = DateTime.fromISO(meet_date).plus({ hours: 24 }).toUTC().toISO()
                            changed_fields.push("expire_at")
                        }
                    }
                } else {
                    let coordinates = oldmeetdoc[field].coordinates

                    if (coordinates[0] != reqbody[field].longitude || coordinates[1] != reqbody[field].latitude) {
                        updatedField[field] = { type: "Point", coordinates: [Number(reqbody[field].longitude), Number(reqbody[field].latitude)] }
                        changed_fields.push(field)
                    }
                }
            }
        }



        await meet.findByIdAndUpdate(meet_id, { ...updatedField, updated_at: date, updated_by: user_id });
        updatedmeet = await meet.findById(meet_id)
        let { _id, ...updatemeets } = updatedmeet._doc

        await meetLog.create({
            meet_id,
            ...updatemeets,
            changed_fields
        })

        if (newParticipant.length) {
            let userdoc
            let addinmeet
            let checkdoc
            let notifytoken
            for (let id of newParticipant) {
                userdoc = await userModel.findById(id).select({ address_cord: 1 })

                checkdoc = await meetParticipant.findOne({ participant_id: id, meet_id })
                if (userdoc) {

                    if (checkdoc) {
                        if (checkdoc.invite_status == 4) {
                            let updatepart = await meetParticipant.findOneAndUpdate({ participant_id: id, meet_id }, { invite_status: 3, updated_at: date, updated_by: user_id }, { new: true })

                            let { _id: aid, ...updatepartchanged } = updatepart._doc
                            await meetParticipantLog.create({
                                participant_doc_id: updatepart._id.toString(),
                                ...updatepartchanged,
                                changed_fields: ["invite_status"]
                            })

                        } else {
                            if (checkdoc.meet_join_status == 14 || checkdoc.meet_join_status == 13) {
                                let changed_fields = ["invite_status", "meet_join_status"]
                                let updatepart
                                if (checkdoc.travel_status != 9) {
                                    updatepart = await meetParticipant.findOneAndUpdate({ participant_id: id, meet_id }, { invite_status: 3, meet_join_status: 15, travel_status: 9, updated_at: date, updated_by: user_id }, { new: true })
                                    changed_fields.push("travel_status")
                                } else {
                                    updatepart = await meetParticipant.findOneAndUpdate({ participant_id: id, meet_id }, { invite_status: 3, meet_join_status: 15, updated_at: date, updated_by: user_id }, { new: true })

                                }
                                let { _id: aid, ...updatepartchanged } = updatepart._doc
                                await meetParticipantLog.create({
                                    participant_doc_id: updatepart._id.toString(),
                                    ...updatepartchanged,
                                    changed_fields
                                })
                            }
                        }
                    } else {
                        addinmeet = await meetParticipant.create({
                            meet_id,
                            meet_admin_id: user_id,
                            participant_id: id,
                            location_cord: { type: 'Point', coordinates: [userdoc.address_cord.coordinates[0], userdoc.address_cord.coordinates[1]] },

                            updated_by: user_id
                        })
                        let { _id: aid, ...addmeet } = addinmeet._doc
                        await meetParticipantLog.create({
                            participant_doc_id: addinmeet._id.toString(),
                            ...addmeet
                        })
                    }
                    notifytoken = await notificationtoken.findOne({ user_id: id, isSignin: true, token: { $ne: "" } })
                    if (notifytoken) {
                        let notifications_doc
                        let name = admindoc.name
                        let meettitle = updatedmeet ? updatedmeet.title : title
                        notifications_doc = { title: `${name} has invited you to a meet- ${meettitle}`, body: `${meettitle} - ${name} has invited you`, url: "HomeScreen", type_id: 108, data: [meet_id, user_id], created_at: date, updated_at: date }
                        await notification.findOneAndUpdate({ user_id: id }, { "$push": { notifications: notifications_doc }, updated_at: date })
                        notifysend({ tokens: [notifytoken.token], title: notifications_doc.title, body: notifications_doc.body, url: notifications_doc.url, type_id: notifications_doc.type_id })

                    }
                }
            }
        }

        if (removedParticipant.length) {
            console.log("inside removedParticipant");
            let userdoc
            let addinmeet
            let checkdoc
            let notifytoken
            for (let id of removedParticipant) {
                userdoc = await userModel.findById(id).select({ address_cord: 1 })
                checkdoc = await meetParticipant.findOne({ participant_id: id, meet_id })
                if (userdoc) {
                    if (checkdoc) {
                        console.log("inside removedParticipant checkdoc");
                        let updatepart = await meetParticipant.findOneAndUpdate({ participant_id: id, meet_id }, { meet_join_status: 14, updated_at: date, updated_by: user_id }, { new: true })

                        let { _id: aid, ...updatepartchanged } = updatepart._doc
                        await meetParticipantLog.create({
                            participant_doc_id: updatepart._id.toString(),
                            ...updatepartchanged,
                            changed_fields: ["meet_join_status"]
                        })
                    }
                    console.log("inside removedParticipant before notifytoken");
                    notifytoken = await notificationtoken.findOne({ user_id: id, isSignin: true, token: { $ne: "" } })
                    if (notifytoken) {
                        let notifications_doc
                        let name = admindoc.name
                        let meettitle = updatedmeet ? updatedmeet.title : title
                        notifications_doc = { title: `${name} has removed you from meet - ${meettitle}`, body: `${meettitle} - ${name} has removed you from meet`, url: "HomeScreen", type_id: 109, data: [meet_id, user_id], created_at: date, updated_at: date }
                        await notification.findOneAndUpdate({ user_id: id }, { "$push": { notifications: notifications_doc }, updated_at: date })
                        notifysend({ tokens: [notifytoken.token], title: notifications_doc.title, body: notifications_doc.body, url: notifications_doc.url, type_id: notifications_doc.type_id })

                    }
                }
            }
        }
        log.info(`${user_id} - User update successfully`)
        res.status(200).json({ message: "Meet has been updated", result: true })

    } catch (error) {
        res.status(400).json({ message: "something went wrong " + error })
        log.error(`Something went wrong at updatemeet - ${FILENAME} - ${PATH}`)
    }

}

export const getusermeets = async (req, res) => {
    let { user_id, currentDate } = req.body

    const resultsPerPage = 10;
    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1

    try {
        console.log("inside user meet");
        let allmeet = await meet.find({ user_id, meet_status: 5, created_at: { $lte: currentDate } }).sort({ created_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
        console.log("inside 1");
        let allmeet_count = await meet.find({ user_id, meet_status: 5, created_at: { $lte: currentDate } }).countDocuments()
        console.log("inside 2");
        res.status(200).json({ allmeet, allmeet_count })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet getusermeet - ${FILENAME} , path - ${PATH} `)
    }
}

export const getsinglemeet = async (req, res) => {
    let { meet_id } = req.body

    try {
        let singlemeet = await meet.findById(meet_id)
        res.status(200).json({ singlemeet })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet getsinglemeet - ${FILENAME} , path - ${PATH} `)
    }
}

export const getsingleparticipantdetails = async (req, res) => {
    let { participant_id } = req.body

    try {
        let participantuser = await userModel.findById(participant_id)
        res.status(200).json({ participantuser })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet getsingleparticipantdetails - ${FILENAME} , path - ${PATH} `)
    }
}

export const getusermeetinvites = async (req, res) => {
    let { participant_id, currentDate, deleteCount } = req.body

    const resultsPerPage = 10;
    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1

    try {
        let meetinvites_count = 0
        if (page == 0) {
            let meetinvites_doc = await meetParticipant.find({ participant_id, invite_status: { $in: [2, 3] }, meet_join_status: { $in: [12, 15] }, isAdmin: false, created_at: { $lte: currentDate }, })

            let meetIds = meetinvites_doc.map(e => {
                return e.meet_id
            })
            meetinvites_count = await meet.findOne({ _id: { $in: meetIds }, meet_status: 5 }).countDocuments()
            console.log(meetinvites_count, "meetinvites_count");
        }
        let doc = {}
        let meetdoc
        let meets = []
        let deleted_meet_count = 0


        let countdoc = 0
        let invite
        let meetinvites
        console.log("before while");
        let i = 0
        while (countdoc < 10) {
            console.log("inside while");
            doc = {}
            invite = await meetParticipant.find({ participant_id, invite_status: { $in: [2, 3] }, meet_join_status: { $in: [12, 15] }, isAdmin: false, created_at: { $lte: currentDate } }).sort({ created_at: -1, _id: -1 }).limit(1).skip((resultsPerPage * page) + deleteCount + i)


            if (!invite.length) {
                break
            }
            meetinvites = await meet.findOne({ _id: invite[0].meet_id, meet_status: 5 })


            if (meetinvites) {
                doc = { ...doc, ...meetinvites._doc, invite_status: invite[0].invite_status }
                meets.push(doc)
                countdoc++
            } else {
                deleted_meet_count++
            }
            i++
        }

        deleted_meet_count += deleteCount
        res.status(200).json({ meetinvites: meets, meetinvites_count, deleted_meet_count })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet getusermeetinvites - ${FILENAME} , path - ${PATH} `)
    }
}

export const addinvitedparticipant = async (req, res) => {
    let { meet_id, participant_id, location_cord } = req.body
    let date = getisotime(DateTime)
    try {

        let checkuser = await userModel.findById(participant_id)

        if (!checkuser) {
            return res.status(400).json({ message: "User doesn't exist" })
        }

        let check = await meetParticipant.findOne({ meet_id, participant_id })
        let checkadmin = await meet.findById(meet_id)

        console.log("before checkadmin");
        if (!checkadmin) {
            return res.status(400).json({ message: "Meet doesn't exist" })
        }

        if (checkadmin.expire_at <= DateTime.now().toUTC().toISO()) {
            return res.status(400).json({ message: "Meet has expired" })
        }
        if (!check) {
            if (checkadmin.user_id == participant_id) {
                return res.status(400).json({ message: "Admin can't be participant" })
            }

            let meetconfigdoc = await meet_config.findOne({}).sort({ created_at: -1 })
            let current_member = await meetParticipant.find({ meet_id, invite_status: { $in: [2, 3] }, isAdmin: false }).countDocuments()

            if (current_member >= meetconfigdoc.member_limit - 1) {

                return res.status(400).json({ message: "Participant member limit reached, you can't join this meet" })
            }

            console.log("inside check")
            let addparticipant = await meetParticipant.create({
                meet_id,
                meet_admin_id: checkadmin.user_id,
                participant_id,
                location_cord: { type: 'Point', coordinates: [Number(location_cord.longitude), Number(location_cord.latitude)] },
                updated_by: participant_id
            })

            let new_current_member = await meetParticipant.find({ meet_id, invite_status: { $in: [2, 3] }, isAdmin: false }).sort({ created_at: 1 }).limit(meetconfigdoc.member_limit - 1)
            let removed_Participant = true
            for (let sp of new_current_member) {
                if (sp.participant_id == participant_id) {
                    removed_Participant = false
                    break
                }
            }

            if (removed_Participant) {
                await meetParticipant.findByIdAndDelete(addparticipant._id.toString())
                return res.status(400).json({ message: "Participant member limit reached, you can't join this meet" })
            }

            let participantfriendlist = await friendList.findOne({ user_id: participant_id, friendIds: checkadmin.user_id })
            let meetadminfriendlist = await friendList.findOne({ user_id: checkadmin.user_id, friendIds: participant_id })
            console.log("before participantfriendlist", participantfriendlist);
            console.log("before participantfriendlist___________admin", meetadminfriendlist);
            if (!participantfriendlist) {
                let addparticipantfriend = await friendList.findOneAndUpdate({ user_id: participant_id }, { $push: { friendIds: checkadmin.user_id }, updated_at: date })

                console.log("inside participantfriendlist");
                let { _id, ...addparticipantfriendupdated } = addparticipantfriend._doc
                await friendListLog.create({
                    user_id: participant_id,
                    ...addparticipantfriendupdated
                })
            }
            if (!meetadminfriendlist) {
                console.log("inside meetadminfriendlist");
                let addadminfriend = await friendList.findOneAndUpdate({ user_id: checkadmin.user_id }, { $push: { friendIds: participant_id }, updated_at: date })
                let { _id, ...addadminfriendupdated } = addadminfriend._doc
                await friendListLog.create({
                    user_id: checkadmin.user_id,
                    ...addadminfriendupdated
                })
            }

            let { _id, ...inviteupdated } = addparticipant._doc
            await meetParticipantLog.create({
                participant_doc_id: addparticipant._id,
                ...inviteupdated
            })

            log.info(`Added invited participant`)
            res.status(200).json({ addparticipant })
        } else {
            res.status(200).json({ message: true })

        }
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Added invited participant failed - ${FILENAME} - ${PATH}`)
    }
}

export const updatemeetinvitestatus = async (req, res) => {
    let { participant_id, meet_id, status } = req.body

    let date = getisotime(DateTime)
    try {
        if (status != 4 && status != 2) {
            return res.status(400).json({ message: "Invalid meet status" })
        }
        let participantdoc = await meetParticipant.findOne({ participant_id, meet_id, invite_status: 3 })
        let userdata = await userModel.findById(participant_id)
        let meetdata = await meet.findById(meet_id)

        let meetconfigdoc = await meet_config.findOne({}).sort({ created_at: -1 })
        let current_member = await meetParticipant.find({ meet_id, invite_status: { $in: [2, 3] }, isAdmin: false }).countDocuments()

        if (current_member >= meetconfigdoc.member_limit) {
            return res.status(400).json({ message: "Participant member limit reached, you can't join this meet" })
        }

        console.log(meetconfigdoc.member_limit, "_______________________member___________", current_member);

        if (!meetdata) {
            return res.status(400).json({ message: "Meet doesn't exist" })
        }
        if (!userdata) {
            return res.status(400).json({ message: "User doesn't exist" })
        }

        let notifytoken = await notificationtoken.findOne({ user_id: meetdata.user_id, isSignin: true, token: { $ne: "" } })
        let notifications_doc
        let name = userdata.name
        let meetTitle = meetdata.title

        if (participantdoc) {
            let invitechange

            if (status == 2) {
                invitechange = await meetParticipant.findOneAndUpdate({ participant_id, meet_id }, { invite_status: status, meet_join_status: 12, updated_at: date, updated_by: participant_id }, { new: true })
                let checkchat = await chat.findOne({ meet_id, users: participant_id })
                if (!checkchat) {
                    await chat.findOneAndUpdate({ meet_id }, { $pull: { admin_removed_users: participant_id }, updated_at: date })
                    await chat.findOneAndUpdate({ meet_id }, { $pull: { users_left_meet: participant_id }, updated_at: date })
                    await chat.findOneAndUpdate({ meet_id }, { $push: { users: participant_id }, updated_at: date })
                }

                let { _id, ...inviteupdated } = invitechange._doc
                await meetParticipantLog.create({
                    participant_doc_id: invitechange._id,
                    ...inviteupdated,
                    changed_fields: ["invite_status", "meet_join_status"]
                })

                await meetActivityLog.create({
                    meet_id,
                    activity_name: `Meet invitation accepted by ${name}`,
                    activity_description: `${name} has accepted the meet invitation`
                })

                if (notifytoken) {

                    notifications_doc = { title: `${name} has accepted meet invitation`, body: `${meetTitle} - ${name} has accepted the meet invitation `, url: "HomeScreen", type_id: 102, data: [meet_id, meetdata.user_id], created_at: date, updated_at: date }
                    let notify = await notification.findOneAndUpdate({ user_id: meetdata.user_id }, { "$push": { notifications: notifications_doc } })
                    notifysend({ tokens: [notifytoken.token], title: notifications_doc.title, body: notifications_doc.body, url: notifications_doc.url, type_id: notifications_doc.type_id })
                }

            } else if (status == 4) {

                invitechange = await meetParticipant.findOneAndUpdate({ participant_id, meet_id }, { invite_status: status, updated_at: date, updated_by: participant_id }, { new: true })

                let { _id, ...inviteupdated } = invitechange._doc
                await meetParticipantLog.create({
                    participant_doc_id: invitechange._id,
                    ...inviteupdated,
                    changed_fields: ["invite_status"]
                })
                await meetActivityLog.create({
                    meet_id,
                    activity_name: `Meet invitation declined by ${name}`,
                    activity_description: `${name} has declined the meet invitation`
                })

                if (notifytoken) {
                    notifications_doc = { title: `${name} has declined meet invitation`, body: `${meetTitle} - ${name} has declined the meet invitation `, url: "HomeScreen", type_id: 103, data: [meet_id, meetdata.user_id], created_at: date, updated_at: date }
                    let notify = await notification.findOneAndUpdate({ user_id: meetdata.user_id }, { "$push": { notifications: notifications_doc }, updated_at: date })

                    notifysend({ tokens: [notifytoken.token], title: notifications_doc.title, body: notifications_doc.body, url: notifications_doc.url, type_id: notifications_doc.type_id })
                }
            }

        } else {
            return res.status(400).json({ message: "You have already accepted or declined the meet" })
        }
        if (status == 2) {

            res.status(200).json({ message: "Participant accepted the meet" })
        } else {
            res.status(200).json({ message: "Participant declined the meet" })
        }

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at updatemeetinvitestatus - ${FILENAME} - ${PATH}`)
    }

}

export const checkparticipantstatus = async (req, res) => {
    let { participant_id, meet_id } = req.body
    try {
        let hasAccepted = false
        let inviteStatus = 3

        let checkstatus = await meetParticipant.findOne({ participant_id, meet_id })

        if (checkstatus) {

            if (checkstatus.invite_status == 2) {
                hasAccepted = true
            }
            inviteStatus = checkstatus.invite_status
        }
        res.status(200).json({ hasAccepted, inviteStatus, joinStatus: checkstatus.meet_join_status })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
}

export const getmeetparticipants = async (req, res) => {
    let { meet_id } = req.body
    try {

        let participants = await meetParticipant.find({ meet_id, isAdmin: false, meet_join_status: { $in: [12, 15] } })
        let participantdoc = []
        let userdoc
        for (let sp of participants) {
            userdoc = await userModel.findById(sp.participant_id)
            if (userdoc) {
                participantdoc.push({ ...sp._doc, name: userdoc.name, photo: userdoc.photo, address: userdoc.address, phone: userdoc.phone, calling_code: userdoc.calling_code, country_code: userdoc.country_code })
            }
        }
        res.status(200).json({ participants: participantdoc })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet getmeetparticipants - ${FILENAME} , path - ${PATH} `)
    }
}

export const getothermeetparticipants = async (req, res) => {
    let { meet_id, user_id } = req.body

    try {
        let participants = await meetParticipant.find({ meet_id, invite_status: 2, participant_id: { $ne: user_id }, meet_join_status: 12 })
        let participantdoc = []
        let userdoc
        for (let sp of participants) {
            userdoc = await userModel.findById(sp.participant_id)
            if (userdoc) {
                participantdoc.push({ ...sp._doc, name: userdoc.name, address: userdoc.address, photo: userdoc.photo, phone: userdoc.phone, calling_code: userdoc.calling_code, country_code: userdoc.country_code })
            }
        }
        res.status(200).json({ participants: participantdoc })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet getothermeeetparticipants - ${FILENAME} , path - ${PATH} `)
    }
}

export const updateparticipant = async (req, res) => {
    let { travel_status, locationCord, participant_id, meet_id } = req.body
    let date = getisotime(DateTime)
    try {
        console.log("outside update participant", travel_status);
        let oldparticipantdata = await meetParticipant.findOne({ participant_id, meet_id })
        let userdata = await userModel.findById(participant_id)

        if (!userdata) {
            return res.status(400).json({ message: "Participant doesn't exist" })

        }

        if (oldparticipantdata.travel_status != 11) {

            console.log("inside update participant", travel_status);
            let updateparticipantdata
            console.log("outside  pdat particpant")

            if (oldparticipantdata.travel_status == 8 && (travel_status == 10 || travel_status == 11)) {
                console.log("inside last location");
                let last_location = ""
                try {
                
                } catch (error) {

                }
                updateparticipantdata = await meetParticipant.findOneAndUpdate({ participant_id, meet_id }, { travel_status, location_cord: { type: "Point", coordinates: [Number(locationCord.longitude), Number(locationCord.latitude)] }, last_location, updated_at: date, updated_by: participant_id }, { new: true })


            } else {
                updateparticipantdata = await meetParticipant.findOneAndUpdate({ participant_id, meet_id }, { travel_status, location_cord: { type: "Point", coordinates: [Number(locationCord.longitude), Number(locationCord.latitude)] }, updated_at: date, updated_by: participant_id }, { new: true })

            }

            if (travel_status == 8) {
                await meetActivityLog.create({
                    meet_id,
                    activity_name: `${userdata.name} is travelling`,
                    activity_description: `${userdata.name} has started travelling`
                })
            }

            if (travel_status == 10) {
                await meetActivityLog.create({
                    meet_id,
                    activity_name: `${userdata.name} has stopped`,
                    activity_description: `${userdata.name} has stopped travelling`
                })
            }

            if (travel_status == 11) {
                await meetActivityLog.create({
                    meet_id,
                    activity_name: `${userdata.name} has reached`,
                    activity_description: `${userdata.name} has reached meet location`
                })
            }

            let { _id, ...participantupdated } = updateparticipantdata._doc
            await meetParticipantLog.create({
                participant_doc_id: updateparticipantdata._id,
                ...participantupdated
            })

            console.log(oldparticipantdata.travel_status, "_______________", travel_status);

            if (oldparticipantdata.travel_status != travel_status) {

                console.log("inside notify", travel_status);
                let allparticipant = await meetParticipant.find({ meet_id, invite_status: 2, meet_join_status: 12, participant_id: { $ne: participant_id } })
                let userIds = allparticipant.map(op => {
                    return op.participant_id
                })
                let notifytoken = await notificationtoken.find({ user_id: { $in: userIds }, isSignin: true, token: { $ne: "" } })
                let userdata = await userModel.findById(participant_id)
                let meetdata = await meet.findById(meet_id)

                console.log("inside update participant", notifytoken);
                console.log("inside update participant", userdata);
                console.log("inside update participant", meetdata);

                if (notifytoken.length && userdata && meetdata) {
                    let notifications_doc
                    let tokens = notifytoken.map(t => {
                        return t.token
                    })

                    let name = userdata.name
                    let meetTitle = meetdata.title

                    if (travel_status == 8) {
                        notifications_doc = { title: `${name} has started travelling`, body: `${meetTitle} - ${name} is travelling now`, url: "HomeScreen", type_id: 104, data: [meet_id, meetdata.user_id], created_at: date, updated_at: date }

                    } else if (travel_status == 10) {
                        notifications_doc = { title: `${name} has stopped travelling`, body: `${meetTitle} - ${name} has stopped now`, url: "HomeScreen", type_id: 105, data: [meet_id, meetdata.user_id], created_at: date, updated_at: date }


                    } else if (travel_status == 11) {
                        notifications_doc = { title: `${name} has reached at meet location`, body: `${meetTitle} - ${name} has reached`, url: "HomeScreen", type_id: 106, data: [meet_id, meetdata.user_id], created_at: date, updated_at: date }

                    }
                    let notify = await notification.updateMany({ user_id: { $in: userIds } }, { "$push": { notifications: notifications_doc }, updated_at: date })
                    notifysend({ tokens, title: notifications_doc.title, body: notifications_doc.body, url: notifications_doc.url, type_id: notifications_doc.type_id })

                }
            }
        }
        log.info(` ${participant_id} - Participant updated`)
        res.status(200).json({ message: "Participant updated" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at updateparticipant - ${FILENAME} - ${PATH}`)
        console.log(error);
    }
}

export const getcurrentparticipantdetails = async (req, res) => {
    let { participant_id, meet_id } = req.body
    try {
        let participantdetails = await meetParticipant.findOne({ participant_id, meet_id })
        res.status(200).json({ participantdetails })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }

}

export const meetdelete = async (req, res) => {
    let { meet_id, user_id } = req.body
    let date = getisotime(DateTime)
    try {
        let deletemeet = await meet.findByIdAndUpdate(meet_id, { meet_status: 7, updated_at: date, updated_by: user_id }, { new: true })

        let { _id, ...meetdeleted } = deletemeet._doc
        await meetLog.create({
            meet_id,
            ...meetdeleted
        })
        log.info(`${meet_id} - Meet has been deleted`)
        res.status(200).json({ message: "Meet deleted" })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at meetdelete - ${FILENAME} - ${PATH}`)
    }
}

export const participantleftmeet = async (req, res) => {
    let { participant_id, meet_id } = req.body
    let date = getisotime(DateTime)
    try {
        let participant = await meetParticipant.findOneAndUpdate({ meet_id, participant_id }, { meet_join_status: 13, updated_at: date, updated_by: participant_id }, { new: true })

        let { _id, ...participantupdated } = participant._doc
        await meetParticipantLog.create({
            participant_doc_id: participant._id,
            ...participantupdated
        })

        let usermeet = await meet.findById(meet_id)
        let allparticipant = await meetParticipant.find({ meet_id, meet_join_status: 12 })
        let allparticipantIds = allparticipant.map(pi => {
            return pi.participant_id
        })
        await chat.findOneAndUpdate({ meet_id }, { $pull: { users: participant_id }, updated_at: date })
        await chat.findOneAndUpdate({ meet_id }, { $push: { users_left_meet: participant_id }, updated_at: date })

        let userdata = await userModel.findById(participant_id)
        let notifications_doc

        let name = userdata.name
        let meetTitle = usermeet.title


        await meetActivityLog.create({
            meet_id,
            activity_name: `${name} left meet`,
            activity_description: `${name} has left the meet`
        })
        notifications_doc = { title: `${name} has left the meet`, body: `${meetTitle} - ${name} has left`, url: "HomeScreen", type_id: 110, data: [meet_id, usermeet.user_id], created_at: date, updated_at: date }

        let notify = await notification.updateMany({ user_id: allparticipantIds }, { "$push": { notifications: notifications_doc }, updated_at: date })
        let notifytoken = await notificationtoken.find({ user_id: allparticipantIds, isSignin: true, token: { $ne: "" } })
        if (notifytoken.length) {
            let tokens = notifytoken.map(o => {
                return o.token
            })

            notifysend({ tokens, title: notifications_doc.title, body: notifications_doc.body, url: notifications_doc.url, type_id: notifications_doc.type_id })
        }
        log.info(`${participant_id} - Participant left the meet`)
        res.status(200).json({ message: "Participant left the meet" })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at participantleftmeet - ${FILENAME} - ${PATH}`)
    }
}

export const meetadminremoveparticipant = async (req, res) => {
    let { meet_id, participant_id } = req.body
    let date = getisotime(DateTime)
    try {
        let updatebyadmin = await meetParticipant.findOneAndUpdate({ meet_id, participant_id }, { meet_join_status: 14, updated_at: date, updated_by: participant_id }, { new: true })

        let { _id, ...participantupdated } = updatebyadmin._doc
        await meetParticipantLog.create({
            participant_doc_id: updatebyadmin._id,
            ...participantupdated,
            changed_fields: ["meet_join_status"]
        })

        await chat.findOneAndUpdate({ meet_id }, { $pull: { users: participant_id }, updated_at: date })
        await chat.findOneAndUpdate({ meet_id }, { $push: { admin_removed_users: participant_id }, updated_at: date })
        let usermeet = await meet.findById(meet_id)

        let userdata = await userModel.findById(usermeet.user_id)
        let participantdata = await userModel.findById(participant_id)
        let notifications_doc

        let name = userdata.name
        let meetTitle = usermeet.title

        if (participantdata) {
            await meetActivityLog.create({
                meet_id,
                activity_name: `${participantdata.name} removed from meet`,
                activity_description: `${participantdata.name} has been removed from the meet`
            })
        }
        notifications_doc = { title: `${name} has removed you`, body: `${meetTitle} - ${name} has removed you from meet`, url: "HomeScreen", type_id: 109, data: [meet_id, usermeet.user_id], created_at: date, updated_at: date }

        let notify = await notification.findOneAndUpdate({ user_id: participant_id }, { "$push": { notifications: notifications_doc }, updated_at: date })
        let notifytoken = await notificationtoken.findOne({ user_id: participant_id, isSignin: true, token: { $ne: "" } })
        if (notifytoken) {
            notifysend({ tokens: [notifytoken.token], title: notifications_doc.title, body: notifications_doc.body, url: notifications_doc.url, type_id: notifications_doc.type_id })
        }
        res.status(200).json({ result: true })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })

    }
}

export const getparticipantbackground = async (req, res) => {
    let { user_id, meet_id } = req.body
    try {
        let meetdoc = await meet.findById(meet_id)
        let participants
        let participantdoc = []
        if (meetdoc) {

            if (meetdoc.user_id == user_id) {
                participants = await meetParticipant.find({ meet_id, isAdmin: false, meet_join_status: { $in: [12, 15] } })

            } else {
                participants = await meetParticipant.find({ meet_id, invite_status: 2, participant_id: { $ne: user_id }, meet_join_status: 12 })
            }

            let userdoc
            for (let sp of participants) {
                userdoc = await userModel.findById(sp.participant_id)
                if (userdoc) {
                    participantdoc.push({ ...sp._doc, name: userdoc.name, address: userdoc.address, phone: userdoc.phone, calling_code: userdoc.calling_code, country_code: userdoc.country_code })
                }
            }
        }
        res.status(200).json({ participantdoc })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet getparticipantbackground - ${FILENAME} , path - ${PATH} `)
    }
}

export const chatmeetdetails = async (req, res) => {
    let { meet_id } = req.body
    try {

        let meetdoc = await meet.findById(meet_id)
        let meetDetails = {}
        let participantDetails = []
        if (meetdoc) {
            let participants = await meetParticipant.find({ meet_id, meet_join_status: 12 })

            let userdoc
            for (let sp of participants) {
                userdoc = await userModel.findById(sp.participant_id)
                if (userdoc) {
                    participantDetails.push(userdoc.name)
                }
            }
            meetDetails = { meetName: meetdoc.title, locationPhoto: meetdoc.location_photo, participantDetails }
        }
        res.status(200).json({ meetDetails })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`Something went wrong at create meet chatmeetdetails - ${FILENAME} , path - ${PATH} `)
    }
}

export const getmeetconfigdetails = async (req, res) => {

    try {
        let meetconfigdetails = await meet_config.findOne({}).sort({ created_at: -1 })
        res.status(200).json({ meetconfigdetails: meetconfigdetails })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
}

export const getmeetactivitylog = async (req, res) => {
    let { meet_id, currentDate } = req.body

    const resultsPerPage = 10;
    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1

    try {
        let meetdoc = await meet.findById(meet_id)

        if (!meetdoc) {
            return res.status(200).json({ message: "Meet doesn't exist" })
        }
        let meetactivitydoc = await meetActivityLog.find({ meet_id, created_at: { $lte: currentDate } }).sort({ created_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
        let meetactivity_count = await meetActivityLog.find({ meet_id, created_at: { $lte: currentDate } }).countDocuments()

        res.status(200).json({ meetActivity: meetactivitydoc, meetactivity_count })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
}





export default createmeet


