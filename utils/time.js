


const getisotime = (obj) => {

    try {
        return obj.now().toUTC().toISO()

    } catch (error) {
        console.log(error);
    }
}

export default getisotime