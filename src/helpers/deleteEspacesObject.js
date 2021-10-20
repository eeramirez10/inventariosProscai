
const deleteEspacesObject = ( object ) => {

    let data = {};
    for (d in object) {
        data[d.trim()] = object[d].trim();
    }

    return data;

}

module.exports = { deleteEspacesObject }