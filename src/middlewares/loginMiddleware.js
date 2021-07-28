
const login = {};

let {  types } = require('../helpers/rolRuta');

login.isAuthenticated = (req, res, next)=>{

   
   
    if (req.isAuthenticated()) return next();
    res.redirect('/');


}

login.isAlmacenista = (req, res, next)=>{

    let { rol } = req.user;


    if(rol !== 'administrador' && rol !== 'Almacenista' ) return res.redirect(types[rol]);
   
    next();

}

login.isCertificado = ({ user }, res, next)=>{

    let { rol } = user;
    
    rol !== 'Certificados' && rol !== 'administrador'? res.redirect(types[rol]) :
    next();
}

login.isAdmin = (req, res, next)=>{

    let { rol } = req.user;

    if(rol !== 'administrador') return res.redirect(types[rol]);
   
    next();
}


login.isCierre =  (req, res, next)=>{

    let { rol } = req.user;

    if(rol !== 'Upload' && rol !== 'administrador') return res.redirect(types[rol]);
   
    next();
}




module.exports = login;