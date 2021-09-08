const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const formidableMiddleware = require('express-formidable');
const app = express();


// Procesos de inserccion 
require('./procesos/procesos.js');

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
app.use(require('./routes/index'));






//Server
app.listen(app.get('port'), () => {
    console.log(`Servidor en el puerto ${app.get('port')}`);
})
