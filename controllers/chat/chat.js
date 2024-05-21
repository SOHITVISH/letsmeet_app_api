import chat from "../../model/chat/chatModel.js";
import { log } from "../../index.js"
import { encryptData, decryptData } from '../../utils/encryption.js'
import userModel from "../../model/user/userModel.js";
import getisotime from "../../utils/time.js";
import { DateTime } from "luxon";


let FILENAME = `chats.js`
let PATH = `controllers/chats/chats.js`


export const getmessages = async (req, res) => {
    let { meet_id, current_date } = req.body

    const resultsPerPage = 10;
    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1


    try {


        let chatobj = await chat.findOne({ meet_id })
        let username = await userModel.find({ _id: { $in: chatobj.users } }).select({ name: 1, photo: 1 })

        let userdoc
        let dmessage = []
        let data

        if (chatobj) {
            let messages = [...chatobj.messages]
            messages.reverse()

            let startingindex

            for (let i = 0; i < messages.length; i++) {
                if (messages[i].created_at <= current_date) {
                    startingindex = i
                    break
                }
            }

            messages = messages.slice(startingindex)

            if (messages.length <= resultsPerPage && page == 0) {

                messages.forEach(pp => {
                    userdoc = username.find(e => {
                        return e._id.toString() == pp.user_id
                    })
                    if (userdoc) {
                        data = decryptData(pp.message)
                        dmessage.push({ ...pp._doc, message: data, name: userdoc.name, photo: userdoc.photo })
                    }


                })

                return res.status(200).json({ messages: dmessage.reverse(), tmCount: messages.length })
            } else {




                let newmsglist = messages.slice(page * resultsPerPage, resultsPerPage + (page * resultsPerPage))



                newmsglist.forEach(pp => {


                    userdoc = username.find(e => {
                        return e._id.toString() == pp.user_id
                    })
                    if (userdoc) {
                        data = decryptData(pp.message)
                        dmessage.push({ ...pp._doc, message: data, name: userdoc.name, photo: userdoc.photo })
                    }
                })
                return res.status(200).json({ messages: dmessage.reverse(), tmCount: messages.length })
            }

        }
        res.status(200).json({ messages: [] })


    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
        log.error(`At get messages - Something went wrong ${error}  FileName-${FILENAME} - Path-${PATH} Route-chat.js`)
    }

}

export const getchatroomid = async (req, res) => {
    let { meet_id } = req.body


    try {
        let chatobj = await chat.findOne({ meet_id }).select({ messages: -1 })
        if (chatobj) {
            res.status(200).json({ roomId: chatobj._id.toString() });
        } else {
            res.status(400).json({ message: "Chat not found" });
        }

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });

    }

}


export const messageseen = async (req, res) => {
    let { meet_id, user_id } = req.body
    let date = getisotime(DateTime)
    let messageIds = []
    try {

        let chatobj = await chat.findOne({ meet_id })
        if (chatobj) {
            let messages = chatobj.messages
            messages.reverse()

            for (let mdoc of messages) {
                if (mdoc.user_id != user_id && !mdoc.seen_by.includes(user_id)) {
                    // if (mdoc.visibility.length == 2) {
                    messageIds.push(mdoc._id)
                    // }
                    //  else {
                    //     if (mdoc.visibility.length == 1) {
                    //         if (mdoc.visibility[0] == user_id) {
                    //             messageIds.push(mdoc._id)
                    //         }
                    //     }
                    // }

                } else {
                    if (mdoc.user_id != user_id && mdoc.seen_by.includes(user_id)) {
                        break
                    }
                }
            }
        }

        if (messageIds.length) {
            let chats = await chat.updateMany({ meet_id }, { "$set": { "messages.$[elem].updated_at": date }, "$push": { "messages.$[elem].seen_by": user_id } }, { arrayFilters: [{ "elem._id": { "$in": messageIds } }] })
            let chatdate = await chat.findOneAndUpdate({ meet_id }, { updated_at: date })
        }
        res.status(200).json({ message: "message update" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
        log.error(`At messageseen - Something went wrong ${error}  FileName-${FILENAME} - Path-${PATH} Route-chat.js`)

    }
}

export const messagenotseen = async (req, res) => {
    const { user_id } = req.body
    try {
        let total_chats = await chat.find({ users: user_id }).select({ messages: 1, meet_id: 1 })
        let all_not_seen = 0
        let nsData = {}

        console.log(total_chats, "==");
        total_chats.forEach(mm => {
            let messages = mm.messages.reverse()
            all_not_seen = 0
            // console.log(mm.meet_id);
            for (let message_doc of messages) {
                if (!message_doc.seen_by.includes(user_id) && (message_doc.user_id != user_id)) {
                    // if (message_doc.visibility.length == 2) {
                    all_not_seen++
                    // }
                    //  else {
                    //     if (message_doc.visibility.length == 1) {
                    //         if (message_doc.visibility[0] == user_id) {
                    //             all_not_seen++
                    //         }
                    //     }
                    // }
                } else {
                    break
                }
            }
            nsData[mm.meet_id] = all_not_seen
        })
        res.status(200).json({ all_nseen: nsData })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
        log.error(`At messagenotseen - Something went wrong ${error}  FileName-${FILENAME} - Path-${PATH} Route-chat.js`)

    }
}

export const getsinglemeetmessagenotseen = async (req, res) => {
    let { meet_id, user_id } = req.body

    try {

        let chatdoc = await chat.findOne({ meet_id }).select({ messages: 1, meet_id: 1 })
        let all_not_seen = 0

        let messages = chatdoc.messages.reverse()

        for (let message_doc of messages) {
            if (!message_doc.seen_by.includes(user_id) && (message_doc.user_id != user_id)) {

                all_not_seen++

            } else {
                break
            }
        }


        res.status(200).json({ all_nseen: all_not_seen })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
        log.error(`At messagenotseen - Something went wrong ${error}  FileName-${FILENAME} - Path-${PATH} Route-chat.js`)

    }
}


export default getmessages




