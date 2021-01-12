const express = require('express');

const moment = require('moment-timezone');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const cron = require('node-cron');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const momentTZMexico = moment().tz('America/Mexico_City').format();



const app = express();


const mes = String(moment().tz('America/Mexico_City').format('M'))

let ultimoDiaMes = moment().tz('America/Mexico_City').endOf('month').format('D');





//controllers
const { buscaRegistrosNuevos,inventarios, traeAlmcantAlmasigandoAlmacenesMexicoMonterreyVeracruz, unidad } = require('./controllers/proscaiController');
const { creaColumnaAFinDeMes,insertaActualiza, insertaABdTuvansa, actualizaAlmcantAlmasignado, actualizaAlmacenesMexicoMonterreyVeracruz, insertaIum } = require('./controllers/tuvansaController');

//

// Se usa una sola vez para insertar la bd de proscai a bd Tuvansa
/* inventarios()
    .then( (inventario) => {

        

        insertaABdTuvansa(inventario)
        .then( resp => console.log(resp))
        .catch( err => console.log(err))
    })
    .catch ( err => console.log(err)) */




cron.schedule('*/20 * * * *', async ()=>{

    console.log('Buscando cambios en Almacenes', momentTZMexico);

    let almacenes = await traeAlmcantAlmasigandoAlmacenesMexicoMonterreyVeracruz()

    actualizaAlmacenesMexicoMonterreyVeracruz(almacenes)
        .then( resp => console.log(resp))
        .catch( err => console.log(err))

},{
    schedule:true,
    timezone:"America/Mexico_City"
})


cron.schedule(`*/5 * * * *`, async ()=>{
     console.log('Buscando registros nuevos', momentTZMexico)

     let registrosNuevos = await buscaRegistrosNuevos()

     insertaActualiza(registrosNuevos)
        .then( resp => console.log(resp))
        .catch( err => console.log(err))

 },{
    schedule:true,
    timezone:"America/Mexico_City"
})



    

    cron.schedule(`0 22 ${ultimoDiaMes} ${mes} *`,()=>{

        creaColumnaAFinDeMes()
        .then(resp => {
            if(resp === undefined){
                return
            }
            console.log(resp)
        })
        .catch( err => console.log(err))

    },{
        schedule:true,
        timezone:"America/Mexico_City"
    })






//Settings

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//middlewares
//app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }))
app.use(cors());
app.use(flash());
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser('secreto'));
app.use(session({
    cookie: { maxAge: null },
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
    secret:'secreto',
    resave: true,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());





//routes
app.use('/', require('./routes/tuvansa'));






//Server
app.listen(app.get('port'), () => {
    console.log(`Servidor en el puerto ${app.get('port')}`);
})
