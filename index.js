const express = require('express')
const app = express()
const path = require('path')

// Serve static files (css, images, media) from public folder
app.use(express.static(path.join(__dirname, 'public')))

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

app.listen(3000, () => {
    console.log('Tricell running at http://localhost:3000')
})