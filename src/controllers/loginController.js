const controller = {};

const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const mysql = require('mysql');
const util = require('util');

const connection = mysql.createConnection({
    host: 'tuvansa-server.dyndns.org',
    user: 'erick',
    password: 'Ag7348pp**',
    database: 'tuvansa'
});

const query = util.promisify(connection.query).bind(connection);

passport.use(new passportLocal( async (username, password, done) =>{

    const buscaUsuario  = await query(`
        SELECT u.id,u.nombre, u.user, a.area, r.rol,s.sucursal from usuario as u
        inner join area as a on u.idArea = a.idArea
        inner join rol as r on u.idRol = r.idRol
        inner join sucursal as s on u.idSucursal = s.idSucursal
        where user = ? && password = ?`,
        [username,password]
    );

    

    if (buscaUsuario.length > 0){
        return done(null,
            { 
                idUsuario: buscaUsuario[0].id, 
                nombre:buscaUsuario[0].nombre,  
                user:buscaUsuario[0].user,
                area: buscaUsuario[0].area, 
                rol: buscaUsuario[0].rol,
                sucursal: buscaUsuario[0].sucursal
            }
        )
    }

    done(null,false,{ message: 'Usuario o password incorrecto'});
}))

passport.serializeUser((user,done)=>{
    done(null, user)
})

passport.deserializeUser((user,done)=>{
    done(null, user)
})




controller.login = (req,res,next)=>{

    if (req.isAuthenticated()){
        return res.redirect('/inventarios');
    }
    res.render('login');
}

controller.loginPost = passport.authenticate('local',{
    failureRedirect:'/',
    successRedirect:'/inventarios',
    failureFlash: true
    
})


module.exports = controller;