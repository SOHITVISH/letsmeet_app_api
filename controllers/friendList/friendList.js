import friendList from "../../model/friendlist/friendListModel.js"
import meetParticipant from "../../model/participant/meetParticipantModel.js"
import userModel from "../../model/user/userModel.js"


const getfriendlist = async (req, res) => {
    let { user_id, currentDate } = req.body

    const resultsPerPage = 10;
    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1
    try {
        let getfriends = await friendList.findOne({ user_id })

        let userdata = await userModel.find({ _id: { $in: getfriends.friendIds }, created_at: { $lte: currentDate } }).select({ name: 1, address: 1, photo: 1 }).sort({ created_at: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page)
        let getfriends_count = await userModel.find({ _id: { $in: getfriends.friendIds }, created_at: { $lte: currentDate } }).countDocuments()

        res.status(200).json({ friendList: userdata, getfriends_count })


    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }

}

export const searchfriend = async (req, res) => {
    let { searchTerm, user_id } = req.body

    const resultsPerPage = 10;
    let page = req.params.page >= 1 ? req.params.page : 1;
    page = page - 1

    try {


        let pattern = new RegExp(searchTerm, 'i')
        let friends = await friendList.findOne({ user_id })
        let result
        let total_count

        result = await userModel.find({ $and: [{ name: { $regex: pattern } }, { _id: { $in: friends.friendIds } }] }).select({ name: 1, address: 1, photo: 1 }).skip(resultsPerPage * page).limit(resultsPerPage)
        total_count = await userModel.find({ $and: [{ name: { $regex: pattern } }, { _id: { $in: friends.friendIds } }] }).countDocuments()

        res.status(200).json({ result, total_count })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export const getselectedfriend = async (req, res) => {
    let { meet_id } = req.body
    try {

        let getfriends = await meetParticipant.find({ $and: [{ meet_id, invite_status: { $in: [2, 3] } }, { meet_join_status: { $in: [12, 15] } }, { isAdmin: false }] })

        let friendIds = getfriends.map(f => {
            return f.participant_id
        })
        let selectedFriends = await userModel.find({ _id: { $in: friendIds } }).select({ name: 1, photo: 1 })

        res.status(200).json({ selectedFriends })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}


export const getfriendscount = async (req, res) => {
    let { user_id } = req.body
    try {

        let friendscount = await friendList.findOne({ user_id })
        if (friendscount) {
            res.status(200).json({ friendsCount: friendscount.friendIds.length })
        } else {
            res.status(200).json({ friendsCount: 0 })
        }
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export default getfriendlist