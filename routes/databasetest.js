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


const ADODB = require('node-adodb');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./data/mdb/researchdata.mdb;');


router.get('/:id', (request, response) =>
{   
    const id = request.params.id;
    async function sqlQuery()
    {
        const result = await connection.query("SELECT * FROM ResearchEntries WHERE researchObjectId ='"+id+"'");
        console.log(result);
        response.write(toString(result));
        response.end();
    }
    sqlQuery();
    
});
module.exports = router;