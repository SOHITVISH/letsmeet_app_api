import express from 'express'
import connect from './database/database.js'
import http from "http"
import { } from "dotenv/config"
import userRouter from "./routes/route.js"
import { Server } from "socket.io"
import cookieParser from 'cookie-parser'
import log4js from 'log4js';
import { DateTime } from 'luxon'
import { encryptData, decryptData } from "./utils/encryption.js"
import statusType from './model/statusType/statusType.js'
import notification_type from './model/notification/notificationType.js'
import notificationtoken from './model/notification/notificationTokenModel.js'
import notification from './model/notification/notificationModel.js'
import getisotime from './utils/time.js'
import notifysend from "./utils/notify.js"
import chat from './model/chat/chatModel.js'
import userModel from './model/user/userModel.js'
import meet_config from './model/meet/meetConfigModel.js'
import cors from "cors"
import meet from './model/meet/meetModel.js'
import { initializeApp } from "firebase/app"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import multer from "multer";
import userModelLog from './model/log/userModelLog.js'
import auth from './controllers/middleware/auth.js'
import meetLog from './model/log/meet/meetLog.js'
import howitswork from './model/howitswork/howitsworkModel.js'
import support from './model/howitswork/supportModel.js'


const app = express();
app.use(express.json({ extended: true }));
app.use(cookieParser());

const server = http.createServer(app);
const PORT = process.env.SERVER_PORT || 8080;


connect();

app.use(
    cors({
        credentials: true,
        origin: ['http://localhost:3000',
            'http://localhost:3001',
            "https://api.plannmeet.com"]
    })
);



app.use("/api/users", userRouter);


//_____________________________________________________________________prifileuplode

const firebaseConfig = {
    storageBucket: process.env.STORAGE_BUCKET,
    apiKey: process.env.STORAGE_API_KEY
}

const firebaseapp = initializeApp(firebaseConfig)

export const firebasestorage = getStorage(firebaseapp)

const storage = multer.memoryStorage()

const upload = multer({ storage });


app.post("/api/profile/img/upload", auth, upload.single("photo"), async (req, res) => {
    let { id, photo } = req.body;
    let date = getisotime(DateTime)
    try {


        //   console.log("1--",req.body.photo ); 
        // let b= Buffer.from(req.body.photo,"base64")
        //   console.log("2--",Buffer.from(req.body.photo,"base64").buffer);

        //   console.log("3--",Buffer.from(b).toString("base64"));
        // console.log(req.file.originalname, "_________req.file.originalname", id);
        // let input = req.file.originalname.replaceAll(" ", "")
        // const imgRef = ref(firebasestorage, "Profile/" + input)
        // console.log(imgRef, "imgref");
        // const snapshot = await uploadBytes(imgRef, req.file.buffer)
        // const imageURL = await getDownloadURL(snapshot.ref)

        let userprofile = await userModel.findByIdAndUpdate(id, { photo, updated_by: id, updated_at: date }, { new: true });

        // console.log("4", userprofile._doc);
        let { _id, ...modifyuserprofile } = userprofile._doc;

        await userModelLog.create({
            user_id: id,
            ...modifyuserprofile,
            changed_fields: ["photo"],
        });
        console.log("5");

        log.info(`profile image saved`)
        res.status(200).json({ message: "save profile", });
    } catch (error) {
        res.status(400).json({ message: "something went wrong " + error });
        log.error(`Something went wrong at /api/profile/img/upload index.js`)
    }
}
);


app.post("/api/removeprofilephoto", auth, async (req, res) => {
    let { id, photo } = req.body;

    let date = getisotime(DateTime)
    try {

        // let replacedurl = url.replace("https://firebasestorage.googleapis.com/v0/b/meetapp-ba02f.appspot.com/o/Profile%2F", "")

        // let modifyurl = replacedurl.split("?")[0]
        // const desertRef = ref(firebasestorage, "Profile/" + modifyurl);
        // await deleteObject(desertRef)

        let oldprodoc = await userModel.findById(id)
        console.log(oldprodoc, "____________oldprodoc");
        // console.log(url, "____________url");   
        // if (oldprodoc.photo == photo) {
        let proinfo = await userModel.findByIdAndUpdate(id, { photo: "", updated_by: id, updated_at: date, }, { new: true });
        let { _id, ...modifyproinfo } = proinfo._doc;

        await userModelLog.create({
            ...modifyproinfo,
            user_id: id,
            changed_fields: ["photo"],
        });
        // }
        res.status(200).json({ message: "Deleted" })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
})

app.post("/api/meetlocation/photo/upload", upload.single("photo"), async (req, res) => {
    let { id, user_id, photo } = req.body;
    let date = getisotime(DateTime)
    try {


        let meetdoc = await meet.findByIdAndUpdate(id, { location_photo: photo, updated_by: user_id, updated_at: date }, { new: true });

        // console.log("4", userprofile._doc);
        let { _id, ...modifymeetdoc } = meetdoc._doc;

        await meetLog.create({
            meet_id: id,
            ...modifymeetdoc,
            changed_fields: ["location_photo"],
        });
        console.log("5");

        log.info(`meet location image saved`)
        res.status(200).json({ message: "save meet location" });
    } catch (error) {
        res.status(400).json({ message: "something went wrong " + error });
        log.error(`Something went wrong at /api/profile/img/upload index.js`)
    }
}
);

app.post("/api/removemeetlocationphoto", auth, async (req, res) => {
    let { id, photo, user_id } = req.body;

    let date = getisotime(DateTime)
    try {

        let meetdoc = await meet.findByIdAndUpdate(id, { location_photo: "", updated_by: user_id, updated_at: date, }, { new: true });
        let { _id, ...modifymeetdoc } = meetdoc._doc;

        await meetLog.create({
            ...modifymeetdoc,
            meet_id: id,
            changed_fields: ["location_photo"],
        });
        // }
        res.status(200).json({ message: "meet location photo Deleted" })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
})


//_________________________________________________________________________profileupload end

//-------------------------------------------------------------------------log4js configure

log4js.configure({
    appenders: {
        letsmeet_app: {
            type: "file",
            filename: `../meetlog/${DateTime.now().toFormat("LLLL dd, yyyy")}-letsmeet_app.log`,
        },
    },
    categories: { default: { appenders: ["letsmeet_app"], level: "trace" } },
});

export const log = log4js.getLogger("letsmeet_app");

//----------------------------------------------------------------log4js configure end here


//----------------------------------------------------------------------Socket.io configure

const io = new Server(server, {
    cors: {
        // origin: "https://letsmeet.ityogistech.com",
        origin: "https://api.plannmeet.com",
        // origin: "http://43.205.42.10",
        methods: ["GET", "POST"],
    },
    path: "/api/letsmeet",
});

io.on("connection", (socket) => {
    console.log('socket.io connected');
    socket.on("travel_start", (data) => {
        socket.join(data.roomId);
        // socket.to(data.roomId).emit("");
        console.log("user joined");
    });

    socket.on("send_travel_data", (data) => {
        // socket.join(data.roomId);
        console.log(data, "____________inside send travel");
        socket.to(data.roomId).emit("get_travel_data", data);
    });


    socket.on("disconnect_meet", data => {
        socket.leave(data.roomId)
        console.log("meet disconnected");
    })

    socket.on("send_voice_data", data => {
        socket.to(data.roomId).emit("get_voice_data", data)
    })


    socket.on("join_chat", async (data) => {
        let date = getisotime(DateTime)
        try {
            socket.join(data.roomId);
            socket.to(data.roomId).emit("user_present", data.user_id);
            await chat.findByIdAndUpdate(data.roomId, { $push: { active_users: data.user_id }, updated_at: date })
        } catch (error) {

        }
    });


    socket.on("send_message", async (data) => {
        let date = getisotime(DateTime);
        const encryptedData = encryptData(data.message);
        console.log("send msg entered");




        let message_doc = {
            message: encryptedData,
            user_id: data.sender_id,
            updated_at: date,
            created_at: date,
        };

        let chatobj = await chat.findOneAndUpdate(
            { meet_id: data.meet_id },
            { $push: { messages: message_doc }, updated_at: date }
        );


        socket.to(data.roomId).emit("receive_message", { ...message_doc, message: data.message, name: data.name, photo: data.photo });


        let chatdoc = await chat.findOne({ meet_id: data.meet_id })
        let meetdoc = await meet.findById(data.meet_id)


        let inActiveUsers = []
        let activeUsers = {}
        chatdoc.active_users.forEach(e => {
            activeUsers[e] = 1

        })

        chatdoc.users.forEach(p => {
            if (!activeUsers[p]) {
                inActiveUsers.push(p)
            }
        })

        if (inActiveUsers.length) {


            // let allmeetusers = [...chatdoc.users, chatdoc.meet_admin]
            // console.log(allmeetusers, "____________________allmeetusers");
            socket.broadcast.emit("chat_message_send", { users: inActiveUsers, meet_id: data.meet_id })


            let notifications_doc;
            notifications_doc = {
                title: "Messages",
                body: "You have received new messages",
                url: "Message",
            };
            let notify = await notificationtoken.find({
                user_id: { $in: inActiveUsers }, isSignin: true, token: { $ne: "" }
            });
            console.log(notify, "_____________notification token@@@@@@@@@@");
            if (notify.length) {


                let tokens = notify.map(t => {
                    return t.token
                })
                let userdata = await userModel.findById(data.sender_id);

                console.log("user data ");
                notifysend({
                    tokens,
                    title: `${meetdoc.title} - ${userdata.name}`,
                    body: data.message,
                    url: "Message",
                    type_id: 107,
                    user_id: data.sender_id,
                });

            }
        }


    });


    socket.on("leave_chat", async (data) => {
        let date = getisotime(DateTime)
        try {
            socket.leave(data.roomId);
            socket.to(data.roomId).emit("user_leaves", data.user_id);
            await chat.findByIdAndUpdate(data.roomId, { $pull: { active_users: data.user_id }, updated_at: date })
        } catch (error) {

        }
    });


    socket.on("meet_delete", async (data) => {
        try {

            socket.to(data.roomId).emit("meet_deleted", data);
            let chatdoc = await chat.findOne({ meet_id: data.roomId })
            socket.to(chatdoc._id.toString()).emit("meet_deleted_chat", data);
        } catch (error) {

        }
    });

    socket.on("removed_by_meet_admin", async (data) => {
        try {
            socket.to(data.roomId).emit("participant_removed_by_meet_admin", data);
            let chatdoc = await chat.findOne({ meet_id: data.roomId })
            socket.to(chatdoc._id.toString()).emit("participant_removed_by_meet_admin_chat", data);
        } catch (error) {

        }
    })

    socket.on("edit_meet", data => {
        try {
            socket.join(data.roomId);
        } catch (error) {

        }

    })

    socket.on("edit_meet_leave", data => {
        try {
            socket.leave(data.roomId);
        } catch (error) {

        }
    })

    // socket.on("edit_meet_removed_participant", data => {
    //     try {
    //         socket.to(data.roomId).emit("edit_meet", data);
    //     } catch (error) {

    //     }
    // })

    socket.on("disconnected", async (data) => {
        console.log("socket.io disconnected")
    })

})

//-------------------------------------------------------------Socket.io configure end here

app.get("/api", (req, res) => {
    res.send("Welcome to Let'smeet App API");
});

app.get("/api/howitworks", async (req, res) => {
    try {

        let help = await howitswork.create({
            status_type_id: 18,
            title: "How its work ?",
            description: "This app is simple to use go and check out vedio which is given below",
            videoData: [{
                videoTitle: "How to create meet ?",
                videoDescription: "",
                videoURL: "https://plannmeet.com/createmeet.mp4",
            },
            {
                videoTitle: "How to share meet ?",
                videoDescription: "",
                videoURL: "https://plannmeet.com/sharemeet.mp4",
            },
            {
                videoTitle: "How to work with meet ?",
                videoDescription: "",
                videoURL: "https://plannmeet.com/workmeet.mp4",
            }],
        })

        res.status(200).json({ help })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
})

app.get("/api/support", async (req, res) => {
    try {

        let supportdata = await support.create({
            status_type_id:19,
            title: "Supportttttttttttttt",
            description: "To know more about this app, you can get suppout by mail support@plannmeet.com or visit to our website -",
            url: ["https://plannmeet.com"],
            supportEmail: ["support@plannmeet.com"]
        })

        res.status(200).json({ supportdata })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
})

app.get("/api/config/statustype", async (req, res) => {
    await statusType.create({ status_type: "USER ACTIVE", status_type_id: 1 });
    await statusType.create({ status_type: "USER REMOVED", status_type_id: -1 });
    await statusType.create({ status_type: "USER BLOCKED", status_type_id: -18 });
    await statusType.create({ status_type: "MEET ACCEPT", status_type_id: 2 });
    await statusType.create({ status_type: "MEET PENDING", status_type_id: 3 });
    await statusType.create({ status_type: "MEET DECLINE", status_type_id: 4 });
    await statusType.create({ status_type: "MEET ACTIVE", status_type_id: 5 });
    await statusType.create({ status_type: "MEET COMPLETED", status_type_id: 6 });
    await statusType.create({ status_type: "MEET DELETE", status_type_id: 7 });
    await statusType.create({ status_type: "RIDE START", status_type_id: 8 });
    await statusType.create({ status_type: "RIDE NOT START", status_type_id: 9 });
    await statusType.create({ status_type: "RIDE PAUSE", status_type_id: 10 });
    await statusType.create({ status_type: "REACHED DESTINATION", status_type_id: 11 });
    await statusType.create({ status_type: "JOINED MEET", status_type_id: 12 });
    await statusType.create({ status_type: "LEFT MEET", status_type_id: 13 });
    await statusType.create({ status_type: "REMOVED BY MEET ADMIN", status_type_id: 14 });
    await statusType.create({ status_type: "NOT JOINED MEET", status_type_id: 15 });
    await statusType.create({ status_type: "CHAT MESSAGE", status_type_id: 16 });
    await statusType.create({ status_type: "CHAT ANNOUNCEMENT", status_type_id: 17 });
    await statusType.create({ status_type: "HOW ITS WORK", status_type_id: 18 });
    await statusType.create({ status_type: "SUPPORT", status_type_id: 19 });

    res.send("Status type configured");
});

app.get("/api/config/notificationtype", async (req, res) => {
    await notification_type.create({ name: "USER SIGNUP", type_id: 101 });
    await notification_type.create({ name: "INVITE ACCEPTED", type_id: 102 });
    await notification_type.create({ name: "INVITE REJECTED", type_id: 103 });
    await notification_type.create({ name: "STARTED TRAVELLING", type_id: 104 });
    await notification_type.create({ name: "STOPPED TRAVELLING", type_id: 105 });
    await notification_type.create({ name: "REACHED MEET LOCATION", type_id: 106 });
    await notification_type.create({ name: "CHAT MESSAGE", type_id: 107 });
    await notification_type.create({ name: "MEET INVITATION RECIEVED", type_id: 108 });
    await notification_type.create({ name: "ADMIN REMOVED PARTICIPANT", type_id: 109 });
    await notification_type.create({ name: "PARTICIPANT LEFT MEET", type_id: 110 });
    await notification_type.create({ name: "NOTIFICATION THROUGH ADMIN PANEL", type_id: 111 });
    await notification_type.create({ name: "MEET CREATE NOTIFY TO ADMIN PANEL", type_id: 112 });
    await notification_type.create({ name: "USER CREATE NOTIFY TO ADMIN PANEL", type_id: 113 });
    res.status(200).json({ message: "Notification Type Created" });
});

app.get("/api/meetconfig", async (req, res) => {
    try {

        await meet_config.create({
            member_limit: 10
        })

        res.status(200).json({ message: "meetConfigured" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
})

app.post("/api/check", async (req, res) => {

    let { user_id } = req.body
    try {
        let notifytoken = (await notificationtoken.findOne({ user_id }))
        if (notifytoken) {
            let notifications_doc
            notifications_doc = { title: "Check Notificaion", body: "Notification send successfully", url: "HomeScreen", type_id: 102, data: [], created_at: getisotime(DateTime), updated_at: getisotime(DateTime) }
            let notify = await notification.findOneAndUpdate({ user_id }, { "$push": { notifications: notifications_doc } })

            if (notifytoken.isSignin) {
                notifysend({ tokens: [notifytoken.token], title: "Check Notificaion", body: "Notification send successfully", url: "HomeScreen", type_id: 102 })
            }
        }
        res.status(200).json({ message: "checked" });
    } catch (error) {
        res.status(400).json({ message: "Not Checked" + error });
    }
})

app.post("/api/backgroundlocation", async (req, res) => {
    let { data } = req.body
    try {
        console.log(data);
        res.status(200).json({ message: "Okay" });
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
})

app.get("/.well-known/apple-app-site-association", (req, res) => {
    try {

        res.json({
            // This section enables Universal Links
            "applinks": {
                "apps": [],
                "details": [
                    {
                        // Example: "QQ57RJ5UTD.com.acme.myapp"
                        "appID": "6X86C9YLQP.com.ityogistechllc.letsmeetapp",
                        // All paths that should support redirecting
                        "paths": ["/invite/*"]
                    }
                ]
            },
            // This section enables Apple Handoff
            "activitycontinuation": {
                "apps": ["6X86C9YLQP.com.ityogistechllc.letsmeetapp"]
            },
            // This section enable Shared Web Credentials
            "webcredentials": {
                "apps": ["6X86C9YLQP.com.ityogistechllc.letsmeetapp"]
            }

        })
    } catch (error) {
        res.status(400).json({ message: "Error occured" })
    }
})


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


