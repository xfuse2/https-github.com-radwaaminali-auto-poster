
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sqlite3 = require('sqlite3').verbose();
const { TwitterApi } = require('twitter-api-v2');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// ==========================================
// ⚠️ البيانات (Facebook & Gemini)
// ==========================================
const PAGE_ID = '870967939438361'; 
const ACCESS_TOKEN = 'EAARotWwKo7ABQK1c68BLk6TugchWsbRcbZC0jIMCv2jXewgnJoz6ZC9qm4wbwcWX3Ly6w2moPtOkd1iZAH3Qp1ws0KEXuOn3ErZAb5sBsN2sx5bbz1rZC2UwAoMlkCCBd0EQZB5vUD5jyH6JZANgevcATn6i52lv67Lr9QP5j4q9ZBSlLSaHZC2a78q8K9gGo15MtSAXLNtSsQtEdKDw7d0IrFsZAneuvgH9s0Ko9sHqzYQkdosvmyoyJEJV4GAB5aXZAu9k3MKMAZA2ZADwC5b5lKB2fzKLe0QZDZD';
const GEMINI_API_KEY = 'AIzaSyBbv7INw1VSASeGj2_KISGRILfQEIDDi9k';

// ==========================================
// ⚠️ بيانات تويتر (Twitter Keys)
// ==========================================
const twitterClient = new TwitterApi({
    appKey: 'Cty1K5107L65apjLNrsfDUSvG',
    appSecret: '7MLJJKyZROJboQIWiii7h2x8VmBFc9Kp1xPATe5ubOy8vpByaO',
    accessToken: '1996499677689352192-CMmMaZGkp6dUh0SPnaXLbX7kHkiwtQ',
    accessSecret: 'b6TCvRDd8KVVxJ1gxd3x8fRZlI3kc2Bw2L98E8ObNSaU1',
});

// ==========================================
// ⚠️ بيانات تيك توك (TikTok Token)
// ==========================================
// 👇👇👇 الصق التوكن الطويل هنا (داخل علامات التنصيص) 👇👇👇
const TIKTOK_ACCESS_TOKEN = 'PASTE_YOUR_TIKTOK_TOKEN_HERE'; 
// ==========================================

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const db = new sqlite3.Database('./autoposter.db');

db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fb_post_id TEXT,
    content TEXT,
    platforms TEXT,
    media_type TEXT,
    status TEXT,
    date TEXT
)`);

// 1. جلب الأرشيف
app.get('/history', (req, res) => {
    db.all("SELECT * FROM posts ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. الذكاء الاصطناعي
app.post('/generate-ai', async (req, res) => {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'الموضوع مطلوب' });
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(`Write a Facebook post about: "${topic}" in Arabic.`);
        res.json({ generatedText: result.response.text() });
    } catch (error) { res.status(500).json({ error: 'AI Error' }); }
});

// 3. النشر (Facebook + Twitter + TikTok)
app.post('/publish', upload.single('mediaFile'), async (req, res) => {
    const message = req.body.message || '';
    const platforms = req.body.platforms ? req.body.platforms.split(',') : ['facebook'];
    const mediaFile = req.file;
    const mediaType = mediaFile ? (mediaFile.mimetype.startsWith('video') ? 'video' : 'image') : 'text';
    const results = [];

    // --- Facebook Publishing ---
    if (platforms.includes('facebook')) {
        try {
            let fbResponse;
            if (mediaFile) {
                const formData = new FormData();
                formData.append('access_token', ACCESS_TOKEN);
                const endpoint = mediaType === 'video' ? 'videos' : 'photos';
                formData.append('source', mediaFile.buffer, { filename: mediaFile.originalname, contentType: mediaFile.mimetype });
                formData.append(mediaType === 'video' ? 'description' : 'message', message);
                
                fbResponse = await axios.post(`https://graph.facebook.com/v19.0/${PAGE_ID}/${endpoint}`, formData, { headers: { ...formData.getHeaders() } });
            } else {
                fbResponse = await axios.post(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, { message, access_token: ACCESS_TOKEN });
            }
            
            const fbId = fbResponse.data.id || fbResponse.data.post_id;
            results.push({ platform: 'Facebook', status: 'Success', id: fbId });

            const stmt = db.prepare("INSERT INTO posts (fb_post_id, content, platforms, media_type, status, date) VALUES (?, ?, ?, ?, ?, ?)");
            stmt.run(fbId, message, platforms.join(', '), mediaType, 'Published', new Date().toLocaleString('ar-EG'));
            stmt.finalize();

        } catch (err) {
            console.error("FB Error:", err.response?.data || err.message);
            results.push({ platform: 'Facebook', status: 'Failed', error: err.message });
        }
    }

    // --- Twitter Publishing ---
    if (platforms.includes('twitter')) {
        try {
            const rwClient = twitterClient.readWrite;
            let tweet;
            
            if (mediaFile) {
                 console.log("Twitter Media Upload skipped (Text only mode).");
                 tweet = await rwClient.v2.tweet(`${message} (Media skipped)`);
            } else {
                 tweet = await rwClient.v2.tweet(message);
            }

            console.log('✅ Twitter Published! ID:', tweet.data.id);
            results.push({ platform: 'Twitter', status: 'Success', id: tweet.data.id });

        } catch (err) {
            console.error("Twitter Error:", err);
            results.push({ platform: 'Twitter', status: 'Failed', error: err.message || JSON.stringify(err) });
        }
    }

    // --- TikTok Publishing ---
    if (platforms.includes('tiktok')) {
        if (!TIKTOK_ACCESS_TOKEN || TIKTOK_ACCESS_TOKEN === 'PASTE_YOUR_TIKTOK_TOKEN_HERE') {
             results.push({ platform: 'TikTok', status: 'Skipped', error: 'Token not set in server.js' });
        } else if (mediaFile && mediaType === 'video') {
             try {
                console.log('🎵 Uploading to TikTok...');
                const fileSize = mediaFile.size;
                
                // 1. Init
                const initResponse = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', {
                    post_info: {
                        title: message.substring(0, 100) || "Uploaded via AutoPoster",
                        privacy_level: "SELF_ONLY", // 🔒 سيظهر في القفل
                        disable_duet: false,
                        disable_comment: false,
                        disable_stitch: false,
                        video_cover_timestamp_ms: 1000
                    },
                    source_info: {
                        source: "FILE_UPLOAD",
                        video_size: fileSize,
                        chunk_size: fileSize,
                        total_chunk_count: 1
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json; charset=UTF-8'
                    }
                });

                const uploadUrl = initResponse.data.data.upload_url;
                
                // 2. Upload
                await axios.put(uploadUrl, mediaFile.buffer, {
                    headers: {
                        'Content-Type': 'video/mp4',
                        'Content-Length': fileSize
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
                
                console.log('✅ TikTok Upload Success!');
                results.push({ platform: 'TikTok', status: 'Success (Check Private/Lock Tab)' });

             } catch (err) {
                console.error("TikTok Error:", err.response?.data || err.message);
                results.push({ platform: 'TikTok', status: 'Failed', error: err.response?.data?.error?.message || err.message });
             }
        } else {
             results.push({ platform: 'TikTok', status: 'Skipped', error: 'TikTok requires a video file.' });
        }
    }

    res.json({ success: true, results });
});

// 4. الحذف
app.delete('/delete/:dbId', async (req, res) => {
    const dbId = req.params.dbId;
    db.get("SELECT fb_post_id FROM posts WHERE id = ?", [dbId], async (err, row) => {
        if (!row) return res.status(404).json({ error: "Post not found" });
        const fbPostId = row.fb_post_id;
        try {
            if (fbPostId && !fbPostId.startsWith('mock_')) {
                await axios.delete(`https://graph.facebook.com/v19.0/${fbPostId}`, { params: { access_token: ACCESS_TOKEN } });
            }
            db.run("DELETE FROM posts WHERE id = ?", [dbId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
        } catch (error) {
            db.run("DELETE FROM posts WHERE id = ?", [dbId]);
            res.json({ success: true, warning: "Deleted from DB only" });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));