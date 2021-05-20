
const login = {};

let {  redirect } = require('../helpers/rolRuta');

login.isAuthenticated = (req, res, next)=>{

   
   
    if (req.isAuthenticated()) return next();
    res.redirect('/');


}

login.isAlmacenista = (req, res, next)=>{

    let { rol } = req.user;


    if(rol !== 'administrador' && rol !== 'Almacenista' ) return res.redirect(redirect[rol]);
   
    next();

}

login.isCertificado = (req, res, next)=>{

    let { rol } = req.user;

    if(rol !== 'administrador' && rol !== 'Certificado' ) return res.redirect(redirect[rol]);
   
    next();
}

login.isAdmin = (req, res, next)=>{

    let { rol } = req.user;

    if(rol !== 'administrador') return res.redirect(redirect[rol]);
   
    next();
}


login.isCierre =  (req, res, next)=>{

    let { rol } = req.user;

    if(rol !== 'Upload' && rol !== 'administrador') return res.redirect(redirect[rol]);
   
    next();
}




module.exports = login;