const express = require('express');
const app = express.Router();

app.use(require('./tuvansa'));
app.use(require('./login'));
app.use(require('./files'));


module.exports = app;