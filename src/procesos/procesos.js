const moment = require('moment-timezone');
const cron = require('node-cron');
const momentTZMexico = moment().tz('America/Mexico_City').format();


const mes = String(moment().tz('America/Mexico_City').format('M'))

let ultimoDiaMes = moment().tz('America/Mexico_City').endOf('month').format('D');

//controllers
const {
    buscaRegistrosNuevos,
    inventarios,
    traeAlmcantAlmasigandoAlmacenesMexicoMonterreyVeracruz,
    unidad,
    getProveedores,
    getLastProveedores
} = require('../controllers/proscaiController');

const { 
    creaColumnaAFinDeMes, 
    insertaActualiza, 
    insertaABdTuvansa, 
    actualizaAlmcantAlmasignado, 
    actualizaAlmacenesMexicoMonterreyVeracruz, 
    insertaIum,
    insertaProveedores
} = require('../controllers/tuvansaController');

//

// Se usa una sola vez para insertar la bd de proscai a bd Tuvansa
// inventarios()
//     .then( (inventario) => {


//         insertaABdTuvansa(inventario)
//         .then( resp => console.log(resp))
//         .catch( err => console.log(err))
//     })
//     .catch ( err => console.log(err))




cron.schedule('*/10 * * * *', async () => {

    console.log('Buscando cambios en Almacenes', momentTZMexico);

    let almacenes = await traeAlmcantAlmasigandoAlmacenesMexicoMonterreyVeracruz()

    actualizaAlmacenesMexicoMonterreyVeracruz(almacenes)
        .then(resp => console.log(resp))
        .catch(err => console.log(err))

}, {
    schedule: true,
    timezone: "America/Mexico_City"
})


cron.schedule(`*/17 * * * *`, async () => {
    console.log('Buscando registros nuevos', momentTZMexico)

    let registrosNuevos = await buscaRegistrosNuevos()

    insertaActualiza(registrosNuevos)
        .then(resp => console.log(resp))
        .catch(err => console.log(err))

}, {
    schedule: true,
    timezone: "America/Mexico_City"
})





cron.schedule(`0 22 ${ultimoDiaMes} ${mes} *`, () => {

    creaColumnaAFinDeMes()
        .then(resp => {
            if (resp === undefined) {
                return
            }
            console.log(resp)
        })
        .catch(err => console.log(err))

}, {
    schedule: true,
    timezone: "America/Mexico_City"
})



cron.schedule('*/12 * * * *', async () => {

    const proveedoresProscai = await getProveedores()

    insertaProveedores( proveedoresProscai )

}, {
    schedule: true,
    timezone: "America/Mexico_City"
});






