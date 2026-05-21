const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
var formidable = require('formidable');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.use(express.static('./public'));
const path = require('path');

const pug = require('pug');
const { response } = require('express');
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');

// --------------------- Läs in Masterframen --------------------------------
const readHTML = require('../readHTML.js');
const fs = require('fs');

var htmlHead = readHTML('./masterframe/head.html');
var htmlHeadloggedin = readHTML('./masterframe/head-loggedin.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlHeaderloggedin = readHTML('./masterframe/header-loggedin.html')
var htmlInfoStart = readHTML('./masterframe/infostart.html');
var htmlInfoStop = readHTML('./masterframe/infostop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');

var htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
var htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
var htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
const ADODB = require('node-adodb');
const connection2 = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');

// ---------------------- Lägg till ny person ------------------------------------------------
router.post('/', function(request, response)
{

        // Array för vilka access levels som krävs, går att expandera
        const validAccessLevels = ["B", "A"];
        if(request.session.loggedin && validAccessLevels.includes(request.session.securityAccessLevel))
        {
            // Ta emot variablerna från formuläret
            var form = new formidable.IncomingForm();
            form.parse(request, function (err, fields, files) 
            {
                var virusNumber = fields.objectCode;
                var virusName = fields.objectName;
                var virusText = fields.objectText;
                var datasheet = fields.objectDatasheet;
                var presentation = fields.objectPresentation;
                var safety = fields.objectHandling;

                var creator = request.cookies.employeecode;
                // Skapa inskrivningsdatumn
                let ts = Date.now();
                let date_ob = new Date(ts);
                let date = date_ob.getDate();
                let month = date_ob.getMonth() + 1;
                let year = date_ob.getFullYear();
                let createdDate = date+"."+month+"."+year;
                let hours = date_ob.getHours();
                if(hours < 10)
                {
                    hours = "0" + hours;
                }
                let minutes = date_ob.getMinutes();
                let createdTime = hours + ":" + minutes;

                // Öppna databasen
                const ADODB = require('node-adodb');
                const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/researchdata.mdb;');

                async function sqlQuery()
                {
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
                    response.write("<div class=\"infobox\"> <div class=\"wrapper\" style=\"max-width: 740px\">");


                    if(request.session.loggedin)
                    {
                        objectStatus = "open";
                        // Skicka SQL-query till databasen 
                        const result = await connection.execute("INSERT INTO ResearchObjects (objectNumber,objectName,objectCreator,objectCreatedDate,objectCreatedTime,objectText,objectStatus,presentationVideoLink,securityVideoLink) VALUES ('"+virusNumber+"','"+virusName+"','"+creator+"','"+createdDate+"','"+createdTime+"','"+virusText+"','"+objectStatus+"','"+presentation+"','"+safety+"')");

                        // Ladda upp filen
                        if(files.objectDatasheet.originalFilename != "")
                        {
                            var oldpath = files.objectDatasheet.filepath;
                            var newpath = path.resolve(__dirname, "../data/safetydatasheets/"+virusNumber+".pdf");
                            fs.renameSync(oldpath, newpath, function (err) 
                            {
                            if (err) throw err;
                            });
                        }

                        // Ge respons till användaren
                        response.write("Virus added<br/><p /><a href=\"http://localhost:3000/api/newvirus\" style=\"color:#336699;text-decoration:none;\">Add another object</a>");
                    }
                    else
                    {
                        response.write("Not logged in");
                    }

                    response.write("</div></div>");
                    response.write(htmlInfoStop);
                    if(request.session.loggedin)
                    {
                        htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
                        response.write(htmlLoggedinMenu);
                    }
                    response.write(htmlFooter);
                    response.write(htmlBottom);
                    response.end();
                }
                sqlQuery();

            });
        }
        else
        {
            response.write(htmlHeader);
            response.write(htmlInfoStart);
            response.write("<div class=\"infobox\"> <div class=\"wrapper\" style=\"max-width: 740px\">");
            response.write("Not logged in or not enough security clearance");
            response.write("</div></div>");
            response.write(htmlInfoStop);
            response.write(htmlFooter);
            response.write(htmlBottom);
            response.end();
        }

   

});

// ---------------------- Formulär för att lägga till ny person ------------------------------
router.get('/', (request, response) =>
{   
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
    response.write("<div class=\"infobox\"> <div class=\"wrapper\" style=\"max-width: 740px\">");

    
    // Array för vilka access levels som krävs, går att expandera
    const validAccessLevels = ["B", "A"];
    if(request.session.loggedin && validAccessLevels.includes(request.session.securityAccessLevel))
    {
        htmlNewEmployeeCSS = readHTML('./masterframe/newvirus_css.html');
        response.write(htmlNewEmployeeCSS);
        htmlNewEmployeeJS = readHTML('./masterframe/newvirus_js.html');
        response.write(htmlNewEmployeeJS);
        htmlNewEmployee = readHTML('./masterframe/newvirus.html'); 
        response.write(htmlNewEmployee);
    }
    else
    {
        response.write("Not logged in or not enough security clearance");
        
    }
    response.write("</div></div>");
    response.write(htmlInfoStop);
    if(request.session.loggedin)
    {
        htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
        response.write(htmlLoggedinMenu);
    }
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();

});

module.exports = router;