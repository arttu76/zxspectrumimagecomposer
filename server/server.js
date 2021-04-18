const express = require('express');
const app = express();
app.use(require('cors')());

const {v4: uuidv4} = require('uuid');

const http = require('http');
const https = require('https');
const fs = require('fs');

const {exec, execSync} = require("child_process");
const bmp = require("bmp-js");

app.get('/', async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const timestamp = Date.now();

    try {
        const id = uuidv4();
        console.log(new Date() + " processing " + req.query.url + " (" + id + ")");

        const getImage = ((('' + req.query.url).toLowerCase().indexOf('https://') === 0) ? https : http).get(
            req.query.url,
            response => {
                const writeStream = fs.createWriteStream("/tmp/" + id);
                response.pipe(writeStream);

                writeStream.on('finish', async () => {
                    await writeStream.close();

                    await execSync("convert /tmp/" + id + " -depth 8 -resize 512x384 /tmp/" + id + ".png");
                    const height = execSync("identify -format \"%h\" /tmp/" + id + ".png", {encoding: 'utf8'});
                    const width = execSync("identify -format \"%w\" /tmp/" + id + ".png", {encoding: 'utf8'});
                    fs.unlinkSync('/tmp/' + id + ".png");

                    await execSync("convert /tmp/" + id + " -depth 8 -resize 512x384 /tmp/" + id + ".rgb");
                    const rgbBuffer = fs.readFileSync("/tmp/" + id + ".rgb");
                    fs.unlinkSync('/tmp/' + id + ".rgb");

                    fs.unlinkSync('/tmp/' + id);

                    res.json({
                        id,
                        timestamp,
                        width: parseInt(width, 10),
                        height: parseInt(height, 10),
                        data: [...rgbBuffer]
                    });
                });
                writeStream.on('error', err => {
                    fs.unlinkSync('/tmp/' + id);
                    throw err;
                });

            }
        );

    } catch
        (err) {
        console.log(err);
        res.status(400).send("Error!");
    }

});

app.listen(13000, () => {
    console.log(new Date() + " listening in port 13000");
});
