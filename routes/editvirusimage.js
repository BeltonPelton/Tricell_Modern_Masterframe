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
const pug_editemployee = pug.compileFile('./masterframe/editemployee.html');



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
var htmlVirusimagesCSS = readHTML('./masterframe/virusimages_css.html');

router.get('/deletevirusimage/:virusId/:imageNumber', function(request, response) {
    let virusId = request.params.virusId;
    let imageNumber = request.params.imageNumber;
    
    async function deleteImage() {
        response.setHeader('Content-type','text/html');
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

        if(request.session.loggedin && (request.session.securityAccessLevel == "B" || request.session.securityAccessLevel == "A")) {
            //Radera bilden
            let imagePath = `./public/virusphoto/${virusId}/${imageNumber}.jpg`;
            if(fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);

                //Omnumrera återstående bilder för att fylla glappet
                const virusImageDir = `./public/virusphoto/${virusId}`;
                if (fs.existsSync(virusImageDir)) {
                    const files = fs.readdirSync(virusImageDir).filter(file => file.endsWith('.jpg')).sort((a, b) => {
                        const numA = parseInt(a.replace('.jpg', ''));
                        const numB = parseInt(b.replace('.jpg', ''));
                        return numA - numB;
                    });

                    files.forEach((file, index) => {
                        const oldPath = path.join(virusImageDir, file);
                        const newfileName = `${index + 1}.jpg`;
                        const newPath = path.join(virusImageDir, newfileName);
                        if (oldPath !== newPath) {
                            fs.renameSync(oldPath, newPath);
                        }
                    });
                }
            }
            else{
                response.write(`<p style="font-size:18px; color:red;">Image not found</p>`);
            }
        }
        else { 
            response.write('<p style="font-size:18px; color:red;">Unauthorized</p>'); 
        }
        response.write(`<p style="font-size:18px; color:green;">Image deleted successfully</p>`);
        response.write(`<a href="http://localhost:3000/api/editvirus/${virusId}" style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#007BFF; color:#fff; text-decoration:none; border-radius:5px;">Back to Edit Virus</a>`);
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
    }
    deleteImage();
});

router.post('/newvirusimage/:id', function(request, response) {
    
    let virusId = request.params.id;

    if(request.session.loggedin && (request.session.securityAccessLevel == "B" || request.session.securityAccessLevel == "A")) {
        var form = new formidable.IncomingForm();
        form.parse(request, function(err, fields, files) {
            async function handleFile() {
                response.setHeader('Content-type','text/html');
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
                response.write(htmlVirusimagesCSS);
                response.write(htmlInfoStart);
                response.write("<div class=\"infobox\"> <div class=\"wrapper\">");
                

                //Kolla om mappen för viruset finns, annars skapa den
                let virusImageDir = `./public/virusphoto/${virusId}`;
                if (!fs.existsSync(virusImageDir)) {
                    fs.mkdirSync(virusImageDir, { recursive: true });
                }


                //Räkna antal bilder som finns för viruset
                let imageNumber = 0;
                while(fs.existsSync(`./public/virusphoto/${virusId}/${imageNumber + 1}.jpg`)) {
                    imageNumber++;
                }

                //Ladda upp bilden
                var ffile = Array.isArray(files.virusimage) ? files.virusimage[0] : files.virusimage;
                if(ffile && ffile.originalFilename != "") {
                    var oldpath = ffile.filepath;
                    var newpath = path.resolve(__dirname, "../public/virusphoto/" + virusId + "/" + (imageNumber + 1) + ".jpg");
                    try{
                        fs.renameSync(oldpath, newpath);
                    } catch(e) {
                        fs.copyFileSync(oldpath, newpath);
                        fs.unlinkSync(oldpath);
                    }                    
                }
                //Ge respons till användaren
                response.write(`<p style="font-size:18px; color:green;">Image uploaded successfully</p>`);
                response.write(`<a href="http://localhost:3000/api/editvirus/${virusId}" style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#007BFF; color:#fff; text-decoration:none; border-radius:5px;">Back to Edit Virus</a>`);

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
            }
            handleFile();
        });
    }
    else {
        response.writeHead(401, {'Content-Type': 'text/html'});
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
        response.write('<h1>Unauthorized</h1><p>You must be logged in with appropriate permissions to upload images.</p>');
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
    }
});

module.exports = router;