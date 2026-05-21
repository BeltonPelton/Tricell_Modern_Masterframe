const express = require('express');
const router = express.Router();

router.use(express.static('./public'));
const path = require('path');

const pug = require('pug');
const { response } = require('express');
const pug_loggedinmenu = pug.compileFile('./masterframe/loggedinmenu.html');

// --------------------- Läs in Masterframen --------------------------------
const readHTML = require('../readHTML.js');
const fs = require('fs');
const { json } = require('express');
const backupVirus = require('../backup.js');
const { getVirusImagesHTML } = require('./virusimages.js');
var htmlVirusimagesCSS = readHTML('./masterframe/virusimages_css.html');

var htmlHead = readHTML('./masterframe/head.html');
var htmlHeadloggedin = readHTML('./masterframe/head-loggedin.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlHeaderloggedin = readHTML('./masterframe/header-loggedin.html')
var htmlInfoStart = readHTML('./masterframe/infostart.html');
var htmlInfoStop = readHTML('./masterframe/infostop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');

const ADODB = require('node-adodb');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/researchdata.mdb;');
const connection2 = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/personnelregistry.mdb;');

// ---------------------- Lista alla virus -------------------------------
router.get('/', (request, response) => { 
    const ADODB = require('node-adodb');
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/researchdata.mdb;');

    async function sqlQuery() {
        try {
            response.writeHead(200, {'Content-Type': 'text/html'});
            //writes masterframe top
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
            response.write("<div class=\"infobox\"> <div class=\"wrapper\">");

            // Hämta nivå för att veta om vi ska dölja arkiverade rader
            let userLevel = request.session.securityAccessLevel ? request.session.securityAccessLevel.toString().trim().toUpperCase() : "";

            let htmlOutput = `
            <link rel="stylesheet" href="css/researchobjects.css" />
            <style>
                .row-archived { background-color: #e0e0e0 !important; color: #777 !important; }
                .row-archived a { color: #666 !important; }
                .resp-table-row { color: #000; }
            </style>`;

            if(request.session.loggedin) {
                htmlOutput +="<table border=\"0\"><tr><td width=\"350\" align=\"left\"><h2>Research Objects:</h2></td><td width=\"350\" align=\"right\"><a href=\"/api/newvirus\" style=\"color:#336699;text-decoration:none;\">Add new object</a></td></tr></table>";
            } else {
                htmlOutput +="<h2>Research Objects:</h2>\n";
            }

            htmlOutput +="<div id=\"table-resp\"><div id=\"table-header\"><div class=\"table-header-cell-light\">Number</div><div class=\"table-header-cell-dark\">Name</div><div class=\"table-header-cell-light\">Created</div><div class=\"table-header-cell-light\">By</div><div class=\"table-header-cell-light\">Entries</div><div class=\"table-header-cell-light\">Last entry</div>";
            if(request.session.loggedin) {
                htmlOutput +="<div class=\"table-header-cell-light\">Edit</div><div class=\"table-header-cell-light\">Delete</div>";
            }
            htmlOutput +="</div><div id=\"table-body\">\n";

            const result = await connection.query("SELECT ro.id, ro.objectNumber, ro.objectName, ro.objectCreatedDate, ro.objectCreator, ro.objectStatus, (SELECT COUNT(*) FROM ResearchEntries re WHERE CStr(re.researchObjectId) = CStr(ro.id)) AS entryCount, (SELECT MAX(re.entryDate) FROM ResearchEntries re WHERE CStr(re.researchObjectId) = CStr(ro.id)) AS lastEntryDate FROM ResearchObjects ro");
                
            for (let i = 0; i < result.length; i++) {
                const row = result[i]; 

                // NY ÄNDRING: Om status är 'archive' och man INTE är nivå A -> Hoppa över denna rad helt
                if (row.objectStatus === 'archive' && userLevel !== 'A') {
                    continue; 
                }

                const archiveClass = (row.objectStatus === 'archive') ? 'row-archived' : '';

                htmlOutput += `<div class="resp-table-row ${archiveClass}">
                    <div class="table-body-cell">${row.objectNumber}</div>
                    <div class="table-body-cell-bigger"><a href="/api/virusdatabase/${row.id}">${row.objectName}</a></div>
                    <div class="table-body-cell">${row.objectCreatedDate}</div>
                    <div class="table-body-cell">${row.objectCreator}</div>
                    <div class="table-body-cell">${row.entryCount || 0}</div>
                    <div class="table-body-cell">${row.lastEntryDate || "-"}</div>`;
                
                if (request.session.loggedin) {
                    htmlOutput += `<div class="table-body-cell"><a href="/api/editvirus/${row.id}" style="color:#336699;text-decoration:none;">E</a></div>
                                   <div class="table-body-cell"><a href="/api/deletevirus/${row.id}" style="color:#336699;text-decoration:none;">D</a></div>`;
                }
                htmlOutput += `</div>\n`;
            }

            htmlOutput += "</div></div>\n\n";
            response.write(htmlOutput); 
            //writes master frame bottom
            response.write("</div></div>");
            response.write(htmlInfoStop);
            if(request.session.loggedin)
            {
                htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
                response.write(htmlLoggedinMenu);
            }
            response.write(htmlFooter);
            response.write(htmlBottom);
            response.end()
        } catch (error) {
            console.error("Databasfel:", error);
            response.status(500).send("Database Error: " + error.message);
        }
    }
    sqlQuery();
});

// --------------------- Växla Open/Archive -------------------
router.get('/toggle/:id', async function(request, response) {
    const targetId = request.params.id;
    
    let userLevel = request.session.securityAccessLevel || "";
    userLevel = userLevel.toString().trim().toUpperCase();

    if (userLevel !== 'A') {
        return response.status(403).send("<h1>Nekat</h1><p>Bara administratörer (A) får göra detta.</p>");
    }

    const ADODB = require('node-adodb');
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/researchdata.mdb;');

    try {
        const result = await connection.query(`SELECT objectStatus FROM ResearchObjects WHERE id = ${targetId}`);
        if (result.length > 0) {
            const currentStatus = result[0].objectStatus;
            const newStatus = (currentStatus === 'open') ? 'archive' : 'open';
            await connection.execute(`UPDATE ResearchObjects SET objectStatus = '${newStatus}' WHERE id = ${targetId}`);
        }
        response.redirect('/api/virusdatabase/' + targetId);
    } catch (error) {
        response.status(500).send("Update failed.");
    }
});



// --------------------- Läs ett specifikt virus -----------------------------
router.get('/:virusid', function(request, response)
{
    if(request.session.loggedin)
    {
        let htmlOutput = "";
        var virusid = request.params.virusid;
        const dirPath = path.join(__dirname, '..', 'data', virusid, 'attachments');

        let attachmentsHTML = '';

        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);

            attachmentsHTML = files.map(file => {
            const fullPath = path.join(dirPath, file);
            const stats = fs.statSync(fullPath);

            return `
            <div class="source_row">
                <span class="source_value">${file}</span>
                <span class="source_size">${(stats.size / 1024).toFixed(1)} KB</span>
                <span class="source_date"></span>
                <span class="source_icons">
                <form method="POST" action="/api/virusdatabase/${virusid}/delete-file" style="display:inline;">
            <input type="hidden" name="fileName" value="${file}"><button type="submit">🗑️</button>
            </form>
                </span>
            </div>
            `;
            }).join('');
        } else {
            attachmentsHTML = `<div class="source_row">Inga filer</div>`;
        }
        // Öppna databasen
        

        async function sqlQuery()
        {
        
            
            

            const int_id = parseInt(virusid);
            // Skicka SQL-query till databasen och läs in variabler
            const objects = await connection.query("SELECT * FROM ResearchObjects WHERE CStr(ID)='"+virusid+"'");
            const entries = await connection.query("SELECT * FROM ResearchEntries WHERE researchObjectId='"+virusid+"'");

            str_id = objects[0]['ID'];      
            str_number = objects[0]['objectNumber'];
            str_name = objects[0]['objectName'];
            str_creator = objects[0]['objectCreator'];
            str_createdDate = objects[0]['objectCreatedDate'];
            str_createdTime = objects[0]['objectCreatedTime'];
            str_text = objects[0]['objectText'];
            str_presentationVideo = objects[0]['presentationVideoLink'];
            str_securityVideo = objects[0]['securityVideoLink'];

            const data = objects[0];
            const btnText = (data.objectStatus === 'open') ? 'Archive Object' : 'Open Object';

            let toggleUrl = (request.session.securityAccessLevel === 'A') 
                ? `/api/virusdatabase/toggle/${data.ID}` 
                : `javascript:alert('Access denied. Incorrect permissions.');`;

    
            // Få fram namnet av användaren som skapade 
            const names = await connection2.query("SELECT name FROM employee WHERE employeeCode = '"+str_creator+"'");

            
            if (names != "")
            {
                str_creatorName = names[0]["name"];
            }
            else
            {
                str_creatorName = "Not found";
            }
            
            

            htmlOutput +=
            "<link rel=\"stylesheet\" href=\"css/virusdatabase.css\" \/>\n" +
            "<table id = \"texttable\">\n" +
            "<tr><td rowspan=\"2\" id=\"objectCode\">"+str_number+"</td>\n" +
            "<td rowspan=\"2\" id=\"objectName\">"+str_name+"</td>\n" +
            "<td id=\"objectCreateTime\">Created: "+str_createdTime+"|"+str_createdDate+"</td></tr>\n" +
            "<tr><td id=\"objectCreator\">By: "+str_creator+"("+str_creatorName+")</td></tr>\n" +
            "</table>\n" +
            "<div id=\"objectText\">"+str_text+"</div>\n";

            htmlOutput += `<div style="display:flex; align-items: center; justify-content: space-between; width: 650px;">
            <a href="http://localhost:3000/api/editvirus/${str_id}" style="color:#336699;text-decoration:none;"> 
                <button style="height: 35px; margin-top:10px; margin-bottom:10px; padding:6px 14px; background:#4682B4;
                 color:#000;
                               border:1px solid #000; border-radius:0;
                               font-size:12px; font-weight:bold; cursor:pointer;">
                    Edit info
                </button></a>
            <a href="http://localhost:3000${toggleUrl}" style="color:#336699;text-decoration:none;"> 
                <button style="height: 35px; margin-top:10px; margin-bottom:10px; padding:6px 14px; background:#4682B4;
                 color:#000;
                               border:1px solid #000; border-radius:0;
                               font-size:12px; font-weight:bold; cursor:pointer;">
                    ${btnText}
                </button></a>
            
                <a href="http://localhost:3000/api/virusdatabase/backup/${str_id}" style="color:#336699;text-decoration:none;"> 
                <button style="height: 35px; margin-top:10px; margin-bottom:10px; padding:6px 14px; background:#4682B4;
                 color:#000; border:1px solid #000; border-radius:0; font-size:12px; font-weight:bold; cursor:pointer;">
                    Backup virus
                </button></a>
            </div>`

            let file = ""; let filesize = "";
            let formattedDate = "";
            // Kollar om viruset har ett ett pdf dokument
            const path = "./data/safetydatasheets/"+str_number+".pdf";
            if(fs.existsSync(path))
            {
                file = str_number + ".pdf"
                const stats = fs.statSync(path);
                filesize = stats.size/1000 + "KB";
                creationdate = stats.birthtime;
                formattedDate = creationdate.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
                });
                
            }
        


            //Maybe add href to file? check with kim
            htmlOutput += "<table id=\"securityTable\">\n" +
            "<tr><td class=\"securityCell\"><b>Security Data Sheet: </b></td><td class=\"securityCell\">"+str_number+"</td>\n" +
            "<td class=\"securityCell\">"+file+"</td><td class=\"securityCell\">"+filesize+"</td><td class=\"securityCell\">"+formattedDate+"</td></tr>\n" +
            "<tr><td class=\"securityCell\"><b>Security Presentation Video: </b></td><td colspan=\"4\" class=\"securityCell\"><a href="+str_presentationVideo+" style=\"color:#336699;text-decoration:none;\">"+str_presentationVideo+"</a></td></tr>\n" +
            "<tr><td class=\"securityCell\"><b>Security Handling Video: </b></td><td colspan=\"4\" class=\"securityCell\"><a href="+str_securityVideo+" style=\"color:#336699;text-decoration:none;\">"+str_securityVideo+"</a></td></tr>\n" +
            "</table>";

            htmlOutput += readHTML('./masterframe/researchentries_css.html');
            htmlOutput += readHTML('./masterframe/researchentries_js.html');
            htmlOutput += readHTML('./masterframe/researchentries.html');
            
            htmlOutput += htmlVirusimagesCSS;
            htmlOutput +=getVirusImagesHTML(virusid);

            htmlOutput +=  `<div class="addNewFile">
                <p>Upload new file<span class="icon_add_file"><a href="/api/data/${virusid}">📝</a></span></p>
                
            </div>
            <span class="source_label">Attachment:</span>
            <div id="sources_container">${attachmentsHTML}</div>
            </div>
            `;
            const currentUserId = request.cookies.employeecode || null;
            const fullContent =
                htmlOutput;


            response.render('user', {
                userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
                content: fullContent
            });

            
        }
        sqlQuery();
    }
    else
    {
        response.setHeader('Content-type','text/html');
        response.write(htmlHead);
        response.write(htmlHeader);
        response.write(htmlInfoStart);
        response.write("<div class=\"infobox\"> <div class=\"wrapper\">");

        response.write("Not logged in");

        response.write("</div></div>");
        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end()
    }
});


// --------------------- Backup ett specifikt virus -----------------------------
router.get('/backup/:virusid', function(request, response)
{
    if(request.session.loggedin)
    {
        var virusid = request.params.virusid;
        
        // Öppna databasen
        

        async function sqlQuery()
        {
            response.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        });
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
            response.write("<div class=\"infobox\"> <div class=\"wrapper\">");

            const int_id = parseInt(virusid);
            // Skicka SQL-query till databasen och läs in variabler
            const objects = await connection.query("SELECT * FROM ResearchObjects WHERE CStr(ID)='"+virusid+"'");
            const entries = await connection.query("SELECT * FROM ResearchEntries WHERE researchObjectId='"+virusid+"'");

            str_id = objects[0]['ID'];      
            str_number = objects[0]['objectNumber'];
            str_name = objects[0]['objectName'];
            str_creator = objects[0]['objectCreator'];
            str_createdDate = objects[0]['objectCreatedDate'];
            str_createdTime = objects[0]['objectCreatedTime'];
            str_text = objects[0]['objectText'];
            str_presentationVideo = objects[0]['presentationVideoLink'];
            str_securityVideo = objects[0]['securityVideoLink'];


            // Få fram namnet av användaren som skapade 
            const names = await connection2.query("SELECT name FROM employee WHERE employeeCode = '"+str_creator+"'");

            
            if (names != "")
            {
                str_creatorName = names[0]["name"];
            }
            else
            {
                str_creatorName = "Not found";
            }
            
            

            let htmlOutput =""+
            "<link rel=\"stylesheet\" href=\"css/virusdatabase.css\" \/>\n" +
            "<table id = \"texttable\">\n" +
            "<tr><td rowspan=\"2\" id=\"objectCode\">"+str_number+"</td>\n" +
            "<td rowspan=\"2\" id=\"objectName\">"+str_name+"</td>\n" +
            "<td id=\"objectCreateTime\">Created: "+str_createdTime+"|"+str_createdDate+"</td></tr>\n" +
            "<tr><td id=\"objectCreator\">By: "+str_creator+"("+str_creatorName+")</td></tr>\n" +
            "</table>\n" +
            "<div id=\"objectText\">"+str_text+"</div>\n";

            if (request.session.securityAccessLevel == "A" || request.session.securityAccessLevel == "B") {
                htmlOutput += `
            <div style="display:flex; align-items: center; justify-content: space-between; width: 650px;">
            <a href="http://localhost:3000/api/editvirus/${str_id}" style="color:#336699;text-decoration:none;"> 
                <button style="height: 35px; margin-top:10px; margin-bottom:10px; padding:6px 14px; background:#4682B4;
                 color:#000;
                               border:1px solid #000; border-radius:0;
                               font-size:12px; font-weight:bold; cursor:pointer;">
                    Edit info
                </button></a>
                <button style="height: 35px; margin-top:10px; margin-bottom:10px; padding:6px 14px; background:#4682B4;
                 color:#000; border:1px solid #000; border-radius:0; font-size:12px; font-weight:bold; cursor:pointer;">`
                if (await backupVirus(objects)) {
                    htmlOutput += `Virus is now backed up`;
                } else {
                    htmlOutput += `Error backing up virus`;
                }
                htmlOutput += `</button></div>`
            };

            let file = ""; let filesize = "";
            let formattedDate = "";
            // Kollar om viruset har ett ett pdf dokument
            const path = "./data/safetydatasheets/"+str_number+".pdf";
            if(fs.existsSync(path))
            {
                file = str_number + ".pdf"
                const stats = fs.statSync(path);
                filesize = stats.size/1000 + "KB";
                creationdate = stats.birthtime;
                formattedDate = creationdate.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
                });
                
            }
        


            //Maybe add href to file? check with kim
            htmlOutput += "<table id=\"securityTable\">\n" +
            "<tr><td class=\"securityCell\"><b>Security Data Sheet: </b></td><td class=\"securityCell\">"+str_number+"</td>\n" +
            "<td class=\"securityCell\">"+file+"</td><td class=\"securityCell\">"+filesize+"</td><td class=\"securityCell\">"+formattedDate+"</td></tr>\n" +
            "<tr><td class=\"securityCell\"><b>Security Presentation Video: </b></td><td colspan=\"4\" class=\"securityCell\"><a href="+str_presentationVideo+" style=\"color:#336699;text-decoration:none;\">"+str_presentationVideo+"</a></td></tr>\n" +
            "<tr><td class=\"securityCell\"><b>Security Handling Video: </b></td><td colspan=\"4\" class=\"securityCell\"><a href="+str_securityVideo+" style=\"color:#336699;text-decoration:none;\">"+str_securityVideo+"</a></td></tr>\n" +
            "</table>";
            response.write(htmlOutput); // Skriv ut 

            //Entry Handling
            entriesCSS = readHTML('./masterframe/researchentries_css.html');
            response.write(entriesCSS);
            entriesJS = readHTML('./masterframe/researchentries_js.html');
            response.write(entriesJS);
            entriesHTML = readHTML('./masterframe/researchentries.html');
            response.write(entriesHTML);

            response.write("</div></div>");
            response.write(htmlInfoStop);
            if(request.session.loggedin)
            {
                htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
                response.write(htmlLoggedinMenu);
            }
            response.write(htmlFooter);
            response.write(htmlBottom);
            response.end()
        }
        sqlQuery();
    }
    else
    {
        response.setHeader('Content-type','text/html');
        response.write(htmlHead);
        response.write(htmlHeader);
        response.write(htmlMenu);
        response.write(htmlInfoStart);
        response.write("<div class=\"infobox\"> <div class=\"wrapper\">");

        response.write("Not logged in");

        response.write("</div></div>");
        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end()
    }
});

module.exports = router;