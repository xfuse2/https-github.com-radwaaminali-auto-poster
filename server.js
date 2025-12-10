// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sqlite3 = require('sqlite3').verbose();
const { TwitterApi } = require('twitter-api-v2');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// AI STUDIO ROUTES (NEW)
// ============================================
const aiStudioRoutes = require('./routes/ai-studio.routes');

// Add rate limiting for AI endpoints
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    success: false,
    error: 'Too many AI requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// Use the AI Studio routes with rate limiting
app.use('/api/ai-studio', aiLimiter, aiStudioRoutes);

console.log('✅ AI Studio routes loaded at /api/ai-studio');

// ==========================================
// ⚠️ البيانات (Facebook & Gemini)
// ==========================================
const PAGE_ID = process.env.FACEBOOK_PAGE_ID || '814051691800923'; 
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || 'EAARotWwKo7ABQONHXF8ZCgqRJFk2LeZATKLccExZCSons2ZALlBlyZCWefXEuB8m2OOkUVgfZCLZB0mn1SoVLDsXkZCqgtAMGrGuOq6FATxZCLZCFRUo2mp51gX1VJRvqTTYWF3jXxJgzXxDqWHTOnMJbfLcDZCp68nzcoKb8n9vgW5U8S5D5BXru0sg3WJ2CLa71JXqqAErZAMwPxm2ZCmX3mPIWTaEcl9a9PnzBhQwjj1AZD';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBbv7INw1VSASeGj2_KISGRILfQEIDDi9k';

// ==========================================
// ⚠️ بيانات SUPABASE (للجدولة والوسائط)
// ==========================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kolpjpsxjhgkxfgptutz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbHBqcHN4amhna3hmZ3B0dXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzA0NzIsImV4cCI6MjA4MDI0NjQ3Mn0.xYJEyLglKC7QLiXRIYu2iGPKt3NaH8p9DrlYNxiyiss';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// ⚠️ بيانات تويتر (Twitter Keys)
// ==========================================
const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY || 'Cty1K5107L65apjLNrsfDUSvG',
    appSecret: process.env.TWITTER_APP_SECRET || '7MLJJKyZROJboQIWiii7h2x8VmBFc9Kp1xPATe5ubOy8vpByaO',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '1996499677689352192-CMmMaZGkp6dUh0SPnaXLbX7kHkiwtQ',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || 'b6TCvRDd8KVVxJ1gxd3x8fRZlI3kc2Bw2L98E8ObNSaU1',
});

// ==========================================
// ⚠️ بيانات تيك توك (TikTok Token)
// ==========================================
// 👇👇👇 الصق التوكن الطويل هنا (داخل علامات التنصيص) 👇👇👇
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || 'PASTE_YOUR_TIKTOK_TOKEN_HERE'; 
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

// --- CRON JOB (العداد) ---
// يعمل كل دقيقة للتحقق من المنشورات المجدولة
cron.schedule('* * * * *', async () => {
    console.log('⏳ Checking scheduled posts...');
    const now = new Date().toISOString();

    // 1. جلب المنشورات المستحقة من Supabase
    // (We check for status = 'scheduled' and scheduled_at <= now)
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now);

    if (error) {
        console.error('❌ DB Error:', error);
        return;
    }

    if (posts && posts.length > 0) {
        console.log(`🚀 Found ${posts.length} posts to publish!`);
        
        for (const post of posts) {
            console.log(`publishing post ${post.id}...`);
            // تنفيذ النشر الفعلي
            // ملاحظة: هنا سنعيد استخدام منطق النشر الموجود في /publish
            // ولكن للاختصار، سنركز على فيسبوك كمثال أساسي، أو يمكنك استدعاء دالة النشر
            
            try {
                // Facebook Publish
                let fbId = 'simulated_cron_id';
                const platforms = post.platforms || ['facebook'];
                
                if (platforms.includes('facebook')) {
                     if (post.media_url) {
                        const formData = new FormData();
                        formData.append('access_token', ACCESS_TOKEN);
                        formData.append('url', post.media_url);
                        const isVideo = post.media_type.startsWith('video');
                        const endpoint = isVideo ? 'videos' : 'photos';
                        formData.append(isVideo ? 'description' : 'message', post.content);
                        
                        // Note: For axios with FormData in Node, headers are tricky. 
                        // Simplified here for clarity, assuming standard fetch or correct headers.
                         const res = await axios.post(`https://graph.facebook.com/v19.0/${PAGE_ID}/${endpoint}`, formData, { headers: formData.getHeaders() });
                         fbId = res.data.id || res.data.post_id;
                     } else {
                         const res = await axios.post(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
                             message: post.content, access_token: ACCESS_TOKEN
                         });
                         fbId = res.data.id;
                     }
                }

                // Update Status to Published
                await supabase
                    .from('posts')
                    .update({ status: 'published', facebook_id: fbId })
                    .eq('id', post.id);

                console.log(`✅ Post ${post.id} published successfully.`);
            } catch (err) {
                console.error(`❌ Failed to publish post ${post.id}:`, err.message);
                // Optionally mark as failed
                await supabase.from('posts').update({ status: 'failed' }).eq('id', post.id);
            }
        }
    }
});


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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));