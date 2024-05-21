import { Expo } from 'expo-server-sdk';


let expo = new Expo();

const notify = async ({ tokens, title, body, url, type_id, user_id }) => {

    try {
        let messages = [];
        for (let pushToken of tokens) {
            if (!Expo.isExpoPushToken(pushToken)) {
                // res.status(400).json({ message: "Invalid token" });
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
                continue;
            }
            messages.push({
                to: pushToken,
                sound: "default",
                title,
                body,
                data: { type_id, url }
            })
        }

        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        for (let chunk of chunks) {
            let ticketchunk = await expo.sendPushNotificationsAsync(chunk)
            tickets.push(...ticketchunk)
        }
    } catch (error) {
        console.log(error);
    }
};

export default notify