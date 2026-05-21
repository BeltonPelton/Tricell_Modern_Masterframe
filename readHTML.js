var fs = require('fs');

function readHTML(htmlfile)
{
 try 
  {
     var htmltext = fs.readFileSync(htmlfile, "utf8")
     htmltext = htmltext.replace(/^\uFEFF/, "");
  } 
  catch (err) 
  {
    console.error(err);
  }
  return htmltext;
}
module.exports = readHTML;

