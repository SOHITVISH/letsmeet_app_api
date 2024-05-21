import { DateTime } from "luxon"
import howitswork from "../../model/howitswork/howitsworkModel.js"
import supportModel from "../../model/howitswork/supportModel.js"
import getisotime from "../../utils/time.js"



const gethowitswork = async (req, res) => {

    try {
        let result = await howitswork.findOne({})
        res.status(200).json({ result })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })

    }
}

export const getsupport = async (req, res) => {

    try {
        let result = await supportModel.findOne({})
        res.status(200).json({ result })
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })

    }
}

export const support = async (req, res) => {
    let { user_id, status_type_id, title, description, url, supportEmail } = req.body
    let date = getisotime(DateTime)
    try {

        let result = await supportModel.findOneAndUpdate({ status_type_id }, { title, description, url, supportEmail, updated_at: date, updated_by: user_id }, { new: true })

        res.status(201).json({ result })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export const howitworks = async (req, res) => {
    let { user_id, status_type_id, title, description, videoData } = req.body
    let date = getisotime(DateTime)
    try {

        let result = await howitswork.findOneAndUpdate({ status_type_id }, { title, description, videoData, updated_at: date, updated_by: user_id }, { new: true })

        res.status(201).json({ result })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
}

export default gethowitswork