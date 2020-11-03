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

passport.use(new passportLocal((username, password, done) => {



    const queryUsuarios = `SELECT u.id,u.nombre, u.user, a.area, r.rol,s.sucursal from usuario as u
    inner join area as a on u.idArea = a.idArea
    inner join rol as r on u.idRol = r.idRol
    inner join sucursal as s on u.idSucursal = s.idSucursal
    where user = ? && password = ?`

    connection.query(queryUsuarios,[username, password],(err, results)=>{

        if (err) throw err;

        console.log(results)


        if (results.length > 0 ){
            return done(null,
                {
                    idUsuario: results[0].id,
                    nombre: results[0].nombre,
                    user: results[0].user,
                    area: results[0].area,
                    rol: results[0].rol,
                    sucursal: results[0].sucursal
                }
            )
        }

       return done(null, false, { message: 'Usuario o password incorrecto' });
    })

    

    
}))

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})




controller.login = (req, res, next) => {


    if (req.isAuthenticated()) {
        return res.redirect('/inventarios');
    }
    res.render('login');


}

controller.loginPost = passport.authenticate('local', {
    failureRedirect: '/',
    successRedirect: '/inventarios',
    failureFlash: true

})


module.exports = controller;