import express from 'express';
const app = express();

import cors from 'cors';
app.use(cors());

import fs from 'fs';
import fetch from 'node-fetch';
import * as uuid from 'uuid';

import { execSync } from "child_process";

app.get('/', async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const timestamp = Date.now();

    const id = uuid.v4();

    try {
        console.log(new Date() + " processing " + req.query.url + " (" + id + ")");

        const url = new URL(req.query.url);
        const host = url.hostname;

        const response = await fetch(req.query.url, { headers: { host } });
        console.log("Response: " + JSON.stringify(response, null, ' '));
        const buffer = await response.arrayBuffer();
        fs.writeFileSync("/tmp/" + id, Buffer.from(buffer));

        await execSync("convert /tmp/" + id + " -depth 8 -resize 512x384 /tmp/" + id + ".png");
        const height = execSync("identify -format \"%h\" /tmp/" + id + ".png", { encoding: 'utf8' });
        const width = execSync("identify -format \"%w\" /tmp/" + id + ".png", { encoding: 'utf8' });

        await execSync("convert /tmp/" + id + " -depth 8 -resize 512x384 /tmp/" + id + ".rgb");
        const rgbBuffer = fs.readFileSync("/tmp/" + id + ".rgb");

        res.json({
            id,
            timestamp,
            width: parseInt(width, 10),
            height: parseInt(height, 10),
            data: [...rgbBuffer]
        });

    } catch (err) {
        console.log(err);
        res.status(400).send("Error!");
    }

    try {
        fs.unlinkSync('/tmp/' + id + ".png");
    } catch (err) { }

    try {
        fs.unlinkSync('/tmp/' + id + ".rgb");
    } catch (err) { }

    try {
        fs.unlinkSync('/tmp/' + id);
    } catch (err) { }

});

app.listen(13000, () => {
    console.log(new Date() + " listening in port 13000");
});
