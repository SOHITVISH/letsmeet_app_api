import express from "express";
const router = express.Router();
import signup, { getsingleuser, resendverificationcode, signout, updateuser, verifyemailcode } from "../controllers/session/signup.js";
import signin from "../controllers/session/signin.js";
import notificationtokens, { checknotifytoken, getusernotifications, setnotificationsignin, updatenotificationseen, updatenotificationvisited } from "../controllers/notification/notification.js";
import createmeet, { addinvitedparticipant, chatmeetdetails, checkparticipantstatus, getcurrentparticipantdetails, getmeetactivitylog, getmeetconfigdetails, getmeetparticipants, getothermeetparticipants, getparticipantbackground, getsinglemeet, getsingleparticipantdetails, getusermeetinvites, getusermeets, meetadminremoveparticipant, meetdelete, participantleftmeet, updatemeet, updatemeetinvitestatus, updateparticipant } from "../controllers/meet/meet.js";
import getinitialtraveldata from "../controllers/travel/travel.js";
import getfriendlist, { getfriendscount, getselectedfriend, searchfriend } from "../controllers/friendList/friendList.js";
import { getchatroomid, getmessages, getsinglemeetmessagenotseen, messagenotseen, messageseen } from "../controllers/chat/chat.js";
import adminsignin, { adminsearchmeet, adminsearchuser, adminsignup, getallusersforadmin, getuserhistory, updateuserstatus,getallmeetforadmin, singleuserphoto, singlemeetlocationphoto, adminnotification, getadminnotification, getadminsearchnotification, updatePassword, updateAdminUser, getTotalUsers, getTotalActiveUsers, getTotalMeets, getStats } from "../controllers/session/adminpanel.js";
import auth from "../controllers/middleware/auth.js";
import  gethowitswork, { getsupport, howitworks, support } from "../controllers/howitswork/howitswork.js";


router.post("/signup", signup)
router.post("/signin", signin)
router.post("/verifyemailcode", verifyemailcode)
router.post("/resendverificationcode", resendverificationcode)
router.put("/updateuser", auth, updateuser)
router.post("/getsingleuser", auth, getsingleuser)
router.post("/signout", signout)
router.post("/notificationtokens", notificationtokens)
router.post("/checknotifytoken", checknotifytoken)
router.post("/setnotificationsignin", setnotificationsignin)
router.post("/getusernotifications/:page", auth, getusernotifications)
router.post("/updatenotificationseen", auth, updatenotificationseen)
router.post("/updatenotificationvisited", auth, updatenotificationvisited)
router.post("/createmeet", auth, createmeet)
router.post("/getusermeets/:page", auth, getusermeets)
router.post("/getsinglemeet", auth, getsinglemeet)
router.post("/getsingleparticipantdetails", getsingleparticipantdetails)
router.post("/getusermeetinvites/:page", auth, getusermeetinvites)
router.post("/addinvitedparticipant", auth, addinvitedparticipant)
router.post("/updatemeetinvitestatus", auth, updatemeetinvitestatus)
router.post("/checkparticipantstatus", auth, checkparticipantstatus)
router.post("/getmeetparticipants", auth, getmeetparticipants)
router.post("/getothermeetparticipants", auth, getothermeetparticipants)
router.post("/getinitialtraveldata", getinitialtraveldata)
router.post("/updateparticipant", auth, updateparticipant)
router.post("/getcurrentparticipantdetails", auth, getcurrentparticipantdetails)
router.post("/getfriendlist/:page", auth, getfriendlist)
router.post("/getmessages/:page", auth, getmessages)
router.post("/getchatroomid", auth, getchatroomid)
router.post("/searchfriend/:page", auth, searchfriend)
router.post("/meetdelete", auth, meetdelete)
router.post("/getselectedfriend", getselectedfriend)
router.post("/updatemeet", auth, updatemeet)
router.post("/participantleftmeet", auth, participantleftmeet)
router.post("/meetadminremoveparticipant", auth, meetadminremoveparticipant)
router.post("/getparticipantbackground", getparticipantbackground)
router.post("/chatmeetdetails", auth, chatmeetdetails)
router.post("/getmeetconfigdetails", getmeetconfigdetails)
router.post("/getfriendscount", auth, getfriendscount)
router.post("/getmeetactivitylog/:page", auth, getmeetactivitylog)
router.get("/gethowitswork", gethowitswork)
router.get("/getsupport", getsupport)
router.post("/messageseen", messageseen)
router.post("/messagenotseen", messagenotseen)
router.post("/getsinglemeetmessagenotseen", getsinglemeetmessagenotseen)

router.post("/howitworks", howitworks)
router.post("/support", support)


//_______________________________ADMIN PANEL
router.post("/adminsignin", adminsignin)
router.post("/adminsignup", adminsignup)
router.post("/getallmeetforadmin/:page", getallmeetforadmin)
router.post("/getallusersforadmin/:page", getallusersforadmin)
router.post("/adminnotification", adminnotification)
router.post("/getadminnotification/:page", getadminnotification)
router.post("/getuserhistory/:page", getuserhistory)
// router.post("/getmeethistory/:page", getmeethistory)
router.post("/updateuserstatus", updateuserstatus)
router.post("/adminsearchuser/:page", adminsearchuser)
router.post("/adminsearchmeet/:page", adminsearchmeet)
router.post("/singleuserphoto", singleuserphoto)
router.post("/singlemeetlocationphoto", singlemeetlocationphoto)
router.post("/getadminsearchnotification/:page", getadminsearchnotification)
router.post("/updatepassword",updatePassword)
router.post("/updateadminuser",updateAdminUser)
router.get("/gettotalusers",getTotalUsers)
router.get("/gettotalactiveusers",getTotalActiveUsers)
router.get("/gettotalmeets",getTotalMeets)
router.get("/getstats",getStats)









export default router;