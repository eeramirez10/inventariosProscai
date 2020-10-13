const express = require('express');
const app = express();
const moment = require('moment');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const cron = require('node-cron');


const mes = String(moment().format('M'))

let ultimoDiaMes = moment().endOf('month').format('D');



//controllers
const { buscaRegistrosNuevos,inventarios } = require('./controllers/proscaiController');
const { creaColumnaAFinDeMes,insertaActualiza, insertaABdTuvansa } = require('./controllers/tuvansaController');

//
/* 
inventarios()
    .then(resp => {
        insertaABdTuvansa(resp)
            .then(resp => console.log(resp))
            .catch(err => console.log(err))
    })
    .then(resp => console.log(resp))
    .catch(err => console.log(err)) */


  cron.schedule(`*/20 * * * *`,()=>{

        buscaRegistrosNuevos()
        .then(resp => {
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

    })






//Settings

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//middlewares
//app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }))
app.use(cors());



//routes
app.use('/', require('./routes/tuvansa'));






//Server
app.listen(app.get('port'), () => {
    console.log(`Servidor en el puerto ${app.get('port')}`);
})
