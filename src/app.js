const express = require('express');

const moment = require('moment');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const cron = require('node-cron');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);



const app = express();


const mes = String(moment().format('M'))

let ultimoDiaMes = moment().endOf('month').format('D');



//controllers
const { buscaRegistrosNuevos,inventarios } = require('./controllers/proscaiController');
const { creaColumnaAFinDeMes,insertaActualiza, insertaABdTuvansa, actualizaAlmcantAlmasignado } = require('./controllers/tuvansaController');

//


cron.schedule('*/20 * * * *', ()=>{
    console.log('Buscando cambios en inventario y asignados', moment().format());
    inventarios()
    .then(resp => {

        actualizaAlmcantAlmasignado(resp)
        .then(resp => console.log(resp))
        .catch(err => console.log(err))

    })
    .catch(err => console.log(err))
},{
    schedule:true,
    timezone:"America/Mexico_City"
})







cron.schedule(`*/50 * * * *`,()=>{
    console.log('Buscando registros nuevos', moment().format())
        buscaRegistrosNuevos()
        .then(resp => {

            console.log(resp)
            insertaActualiza(resp)
                .then(resp => console.log(resp))
                .catch(err => console.log(err))  
        })
        .catch(err => console.log(err)) 

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
    cookie: { maxAge:86400000},
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
    secret:'secreto',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());





//routes
app.use('/', require('./routes/tuvansa'));






//Server
app.listen(app.get('port'), () => {
    console.log(`Servidor en el puerto ${app.get('port')}`);
})
