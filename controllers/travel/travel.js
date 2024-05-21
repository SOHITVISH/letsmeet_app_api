import meetParticipant from "../../model/participant/meetParticipantModel.js"
import userModel from "../../model/user/userModel.js"



const getinitialtraveldata = async (req, res) => {
    let { meet_id, participant_id } = req.body
    try {

        let getinitial = await meetParticipant.find({ meet_id, participant_id: { $ne: participant_id }, travel_status: 11 })
        let participantIds = getinitial.map(e => {
            return e.participant_id
        })

        let participant = await userModel.find({ _id: { $in: participantIds } })

        let doc = {}
        let userdoc = null
        let initialData = {}
        getinitial.forEach(idata => {
            doc = { location_cord: { longitude: idata.location_cord.coordinates[0], latitude: idata.location_cord.coordinates[1] }, meet_id: idata.meet_id }

            userdoc = participant.find(p => {
                return p._id.toString() == idata.participant_id
            })

            if (userdoc) {
                doc = { ...doc, name: userdoc.name, hasReachedLocation: true, disAway: "", currentLocationName: "" }
                initialData[participant_id] = doc
            }
        })

        res.status(200).json({ initialData })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }

}

export default getinitialtraveldata