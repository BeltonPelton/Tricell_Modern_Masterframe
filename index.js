/* ----------------------------- 3:rd party-moduler ------------------------------ */
const config = require('./config/globals.json');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();                  /* Skapa webbserver-objektet */

const path = require('path');
// Tell Express where your templates are stored (usually a folder named "views")
app.set('views', path.join(__dirname, 'public'));

// Tell Express to use EJS as the rendering engine
app.set('view engine', 'ejs');

app.use(express.static('./public'));    /* Skapa global path till "public"-mappen */

var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(
    session({
    secret: 'thisisasecret',
    saveUninitialized: true,
    resave: false
    }));

app.use(bodyParser.json());
app.use(
bodyParser.urlencoded({
extended: true
}));

const pug = require('pug');
const { response } = require('express');
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');

/* ------------------------------ Egna moduler ----------------------------------- */
const readHTML = require('./readHTML.js');

    /* Läs respektive HTML-text-sida för Masterframen */
    var htmlHead = readHTML('./masterframe/head.html');
    var htmlHeadloggedin = readHTML('./masterframe/head-loggedin.html');
    var htmlHeader = readHTML('./masterframe/header.html');
    var htmlHeaderloggedin = readHTML('./masterframe/header-loggedin.html')
    var htmlMenu = readHTML('./masterframe/menu.html');
    var htmlInfoStart = readHTML('./masterframe/infoStart.html');
    var htmlIndex = readHTML('./public/text/index.html');
    var htmlInfoStop = readHTML('./masterframe/infoStop.html');
    var htmlFooter = readHTML('./masterframe/footer.html');
    var htmlBottom = readHTML('./masterframe/bottom.html');


/* ------------- Skapa routes för de alternativa rutterna i webbapplikationen ------------------------- */

const info = require('./routes/info');
const personnelregistry = require('./routes/personnelregistry');
const login = require('./routes/login');
const logout = require('./routes/logout');
const virusdatabase = require('./routes/virusdatabase');
const newemployee = require('./routes/newemployee');
const deleteemployee = require('./routes/deleteemployee');
const editemployee = require('./routes/editemployee');
const getchat = require('./routes/getchat');
const chat = require('./routes/chat');
const newvirus = require('./routes/newvirus');
const editvirus = require('./routes/editvirus');
const deletevirus = require('./routes/deletevirus');
const entries = require("./routes/entries.js");
const userdatabase = require('./routes/userdatabase');
const panic = require('./routes/panic');
const editvirusimage = require('./routes/editvirusimage');
const livestream = require('./routes/livestream.js');
const fileUploadRouter = require('./routes/fileuploadvirus.js');
const activityLog = require('./routes/activityLog');






/* -------------- Skapa default-router (om ingen under-sökväg anges av användaren) --------------------- */
app.get('/', function(request, response)
{
    const infotext = request.params.infotext;
    
    response.setHeader('Content-type','text/html');
    if(request.session.loggedin)
    {
        
        response.write(htmlHeadloggedin);
        response.write(htmlHeaderloggedin);
        
    }
    else
    {
        response.write(htmlHead);
        response.write(htmlHeader);
    }
    
    

  

    
    response.write(htmlInfoStart);
    htmlInfo = readHTML('./public/text/index.html');
    response.write(htmlInfo);    
    response.write(htmlInfoStop);

    if(request.session.loggedin)
    {
        htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
        response.write(htmlLoggedinMenuCSS);
        htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
        response.write(htmlLoggedinMenuJS);
        //htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
        //response.write(htmlLoggedinMenu);
        response.write(pug_loggedinmenu({
                employeecode: request.cookies.employeecode,
                name: request.cookies.name,
                logintimes: request.cookies.logintimes,
                lastlogin: request.cookies.lastlogin,
                securityaccesslevel: request.session.securityAccessLevel
              }));
    }

    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();
});


app.use('/api/info', info);
app.use('/api/personnelregistry', personnelregistry);
app.use('/api/login', login);
app.use('/api/logout', logout);
app.use('/api/virusdatabase', virusdatabase);
app.use('/api/newemployee', newemployee);
app.use('/api/deleteemployee', deleteemployee);
app.use('/api/editemployee', editemployee);
app.use('/api/getchat', getchat);
app.use('/api/chat', chat);
app.use('/api/newvirus', newvirus);
app.use('/api/editvirus', editvirus);
app.use('/api/deletevirus', deletevirus);
app.use('/api/entries', entries);
app.use('/api/userdatabase', userdatabase);
app.use('/api/panic', panic);
app.use('/api/editvirusimage', editvirusimage);
app.use('/api/livestream', livestream);
app.use('/api/data', fileUploadRouter);
app.use('/api/activitylog', activityLog);


/* ---------------------------------- Starta webbservern ------------------------------ */
const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Listening on port ${port}... `));