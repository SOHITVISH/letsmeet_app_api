import notificationtoken from "../../model/notification/notificationTokenModel.js"
import notificationtokenlog from "../../model/log/notification/notificationTokenLog.js";
import notification from "../../model/notification/notificationModel.js";

import notifysend from "../../utils/notify.js";
import { log } from "../../index.js";
import getisotime from "../../utils/time.js";
import { DateTime } from "luxon";



const notificationtokens = async (req, res) => {

    const { user_id, notifyToken } = req.body;
    let notifytokens
    let date = getisotime(DateTime)
    try {

        let notify = await notificationtoken.findOne({ user_id })
        // let user = await userModel.findById(user_id)

        if (notify) {
            let notifydoc = await notificationtoken.findByIdAndUpdate(notify._id, { token: notifyToken, isSignin: true, updated_at: date }, { new: true })

            let { _id, ...modifyresult } = notifydoc._doc
            await notificationtokenlog.create({
                user_id,
                ...modifyresult
            })

            return res.status(201).json({ token: notifydoc })
        } else {
            notifytokens = await notificationtoken.create({
                user_id,
                token: notifyToken,
            });

            let notifymodel = await notification.create({
                user_id,
                notifications: []
            })

            await notificationtokenlog.create({
                user_id,
                token: notifyToken,
            })

            // if (!user.phone) {

            notifysend({ tokens: [notifyToken], title: "Welcome to letsmeet APP", body: "Please complete your profile", type_id: 101, url: "Profile" })
            // }
            log.info(`Notification token run successfully`)
            return res.status(201).json({ token: notifytokens })
        }
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
        log.error(`Something went wrong at notification token - notification.js`, error)
    }

}

export const checknotifytoken = async (req, res) => {

    let { token, user_id } = req.body
    let date = getisotime(DateTime)

    try {
        // let response = { isSignin: false, result: false }

        let notifydoc = await notificationtoken.findOne({ user_id, token })

        if (notifydoc) {
            if (notifydoc.isSignin) {
                return res.status(200).json({ result: true })
            } else {
                let token_doc = await notificationtoken.findOneAndUpdate({ user_id }, { isSignin: true, updated_at: date }, { new: true })

                let { _id, ...modifyresult } = token_doc._doc
                await notificationtokenlog.create({
                    user_id,
                    ...modifyresult
                })
            }
            return res.status(200).json({ result: true })
        } else {
            return res.status(200).json({ result: false })
        }

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
        log.error(`Something went wrong at checknotifytoken - notification.js`, error)
    }
}

export const setnotificationsignin = async (req, res) => {

    let { signin_status, user_id } = req.body
    let date = getisotime(DateTime)

    try {

        let token_doc = await notificationtoken.findOneAndUpdate({ user_id }, { isSignin: signin_status, updated_at: date }, { new: true })

        let { _id, ...modifyresult } = token_doc._doc
        await notificationtokenlog.create({
            user_id,
            ...modifyresult
        })

        return res.status(201).json({ token_doc })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
        log.error(`Something went wrong at setnotificationsignin - notification.js`, error)
    }
}

export const getusernotifications = async (req, res) => {

    let { user_id, currentDate } = req.body

    const resultsPerPage = 10;
    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1

    try {
        let data_doc = []
        let notification_data

        let notificationdoc = await notification.findOne({ user_id })
        if (!notificationdoc) {
            return res.status(200).json({ notifications: [], nsCount: 0, notifCount: 0 })
        }
        notification_data = notificationdoc.notifications
        notification_data.reverse()

        let nd
        let count = 0

        if (page == 0) {
            for (nd of notification_data) {
                if (!nd.seen) {
                    count++
                } else {
                    break
                }
            }
        }
        for (let ind = page * resultsPerPage; ind < notification_data.length; ind++) {
            if (notification_data[ind].created_at < currentDate) {
                data_doc.push(notification_data[ind])
            }
            if (data_doc.length >= 10) {
                break
            }
        }
        res.status(200).json({ notifications: data_doc, notifCount: notification_data.length, nsCount: count })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export const updatenotificationseen = async (req, res) => {
    let { user_id, notifyIds } = req.body
    let date = getisotime(DateTime)
    try {

        let notify = await notification.updateMany({ user_id }, { "$set": { "notifications.$[elem].seen": true, "notifications.$[elem].updated_at": date } }, { arrayFilters: [{ "elem._id": { "$in": notifyIds } }] })
        let notifys = await notification.findOneAndUpdate({ user_id }, { updated_at: date })
        log.info(`updatenotificationseen run successfully`)
        res.status(200).json({ message: "Notification update" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
        log.error(`Something went wrong at updatenotificationseen - notification.js`, error)
    }
}

export const updatenotificationvisited = async (req, res) => {
    let { user_id, notify_id } = req.body

    let date = getisotime(DateTime)

    try {
        let notify = await notification.findOneAndUpdate({ user_id, "notifications._id": notify_id }, { "$set": { "notifications.$.visited": true, "notifications.$.updated_at": date } })
        let notifys = await notification.findOneAndUpdate({ user_id }, { updated_at: date })
        log.info(`updatenotificationvisited run successfully`)
        res.status(200).json({ message: "Notification update" })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
        log.error(`Something went wrong at updatenotificationvisited - notification.js`, error)
    }
}





export default notificationtokens