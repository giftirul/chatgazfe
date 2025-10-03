// Proses Import
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

import 'dotenv/config';

//mulai persiapan project kita
//
// 1. inisialisasi express
//const express = require('express'); //tambahan dr copilot
const app = express();
const ai = new GoogleGenAI({});

// 2. inisialisasi middleware

app.use(cors());
// app.use(multer());
app.use(express.json());

// 3. inisialisasi endpoint
// [HTTP method: GET, POST, PUT, PATCH, DELETE]
// .get() --> utamanya untuk mengambil data, atau search
// .post() --> utamanya untuk menaruh (post) data baru ke dalam server
// .put() --> utamanya untuk menimpa data yang sudah ada di dalam server
// .patch() --> utamanya untuk "menambal" data yang sudah ada di dalam server
// .delete() --> utamanya untuk menghapus data yang ada di dalam server

// endpoint POST /chat
app.post(
    '/chat', //
    async (req, res) => {
        const { body } =  req;
        const { prompt  } = body;

        // guard clause -- satpam
        if (!prompt || typeof prompt !== 'string') {
            res.status(400).json({
                message: "Prompt harus diisi dan berupa string",
                data: null,
                success: false
            });
            return;
        }
   
        //dagingnya A5 Wagyu
        try {
            // 3rd party API -- Google AI
            const aiResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            });

            res.status(200).json({
                success: true,
                data: aiResponse.text,
                message: "Berhasil ditanggapi oleh Google Gemini Flash!"
            });
        } catch (e) {
            console.log(e);
            res.status(500).json({
                success: false,
                data: null,
                message: e.message|| "Ada masalah di server gan!"
            })
        }
    }
);

// entry point-nya
app.listen(3000, () => {
    console.log("I LOVE YOU 3000");
});
