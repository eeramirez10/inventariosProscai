const express = require('express');
const app = express.Router();

app.use(require('./tuvansa'));
app.use(require('./login'));
app.use(require('./cierre'));
app.use(require('./usuarios'));
app.use(require('./certificados'));

app.use(require('./tablas.routes'));


module.exports = app;