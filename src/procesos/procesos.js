const moment = require('moment-timezone');
const cron = require('node-cron');
const momentTZMexico = moment().tz('America/Mexico_City').format();


const mes = String(moment().tz('America/Mexico_City').format('M'))

let ultimoDiaMes = moment().tz('America/Mexico_City').endOf('month').format('D');

//controllers
const {
    inventarios,
    AlmacenesMtyVer,
    getProveedores,
 
} = require('../controllers/proscaiController');

const { 
    creaColumnaAFinDeMes, 
    insertaActualiza, 
    insertaProveedores
} = require('../controllers/tuvansaController');




cron.schedule('*/10 * * * *', async () => {

    try {

        console.log('Buscando cambios en Almacenes', momentTZMexico);

        const inventariosProscai = await inventarios();
        const almMtyVer = await AlmacenesMtyVer();
    
        await insertaActualiza(inventariosProscai, almMtyVer );
        
    } catch (error) {
        console.log(error)
    }



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






