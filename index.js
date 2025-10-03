// proses import dependency ke dalam file index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

import 'dotenv/config';

// mulai persiapkan project kita

// 1. Inisialisasi Express dan GoogleGenAI

const app = express();
const ai = new GoogleGenAI({});

// 2. inisialisasi middleware

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 3. inisialisasi endpoint
// [HTTP method: GET, POST, PUT, PATCH, DELETE]
// .get()    --> utamanya untuk mengambil data, atau search
// .post()   --> utamanya untuk menaruh (post) data baru ke dalam server
// .put()    --> utamanya untuk menimpa data yang sudah ada di dalam server
// .patch()  --> utamanya untuk "menambal" data yang sudah ada di dalam server
// .delete() --> utamanya untuk menghapus data yang ada di dalam server

// endpoint POST /chat
app.post(
  '/chat', // http://localhost:[PORT]/chat
  async (req, res) => {
    const { body } = req;
    const { conversation } = body;

    // Contoh struktur body yang diharapkan:
    // { "conversation": [{ "role": "user", "text": "Halo!" }] }

    // Guard Clause #1: Memastikan 'conversation' ada dan merupakan sebuah array.
    if (!conversation || !Array.isArray(conversation)) {
      // Menggunakan return untuk menghentikan eksekusi setelah mengirim respons.
      res.status(400).json({
        message: "Percakapan harus valid!",
        data: null,
        success: false
      });
      return;
    }

    // guard clause #2 -- satpam ketat!
    const conversationIsValid = conversation.every((message) => {
      // kondisi pertama -- message harus truthy
      if (!message) return false;

      // kondisi kedua -- message harus berupa object, namun bukan array!
      if (typeof message !== 'object' || Array.isArray(message)) return false;

      // kondisi ketiga -- message harus berisi hanya role dan text
      const keys = Object.keys(message);
      const keyLengthIsValid = keys.length === 2;
      const keyContainsValidName = keys.every(key => ['role', 'text'].includes(key));

      if (!keyLengthIsValid || !keyContainsValidName) return false;

      // kondisi keempat
      // -- role harus berupa 'user' | 'model'
      // -- text harus berupa string

      const { role, text } = message;
      const roleIsValid = ['user', 'model'].includes(role);
      const textIsValid = typeof text === 'string';

      if (!roleIsValid || !textIsValid) return false;

      // selebihnya...

      return true;
    });

    if (!conversationIsValid) {
      res.status(400).json({
        message: "Percakapan harus valid!",
        data: null,
        success: false
      });
      return;
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    // Memanggil API Google Gemini
    try {
      // Pastikan nama model sudah benar, contoh: 'gemini-1.5-flash-latest'
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents
      });

      res.status(200).json({
        success: true,
        data: aiResponse.text,
        message: "Berhasil ditanggapi oleh Google Gemini Flash!"
      });
    } catch (error) {
      console.error("Error saat memanggil Google AI:", error);
      return res.status(500).json({
        success: false,
        data: null,
        message: error.message || "Terjadi kesalahan pada server!"
      })
    }
  }
);

// entry point-nya
app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});