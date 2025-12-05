const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// --- مفاتيحك (تأكدي أنها صحيحة من إعدادات تيك توك) ---
const CLIENT_KEY = 'sbaw7cyyzqn779k7zg'; 
const CLIENT_SECRET = 'LH4fnHtLfcw4LlkkGIhA8fwEnwe7XJ8c'; 
const REDIRECT_URI = 'http://localhost:3000/callback'; 

// صفحة الدخول
app.get('/login', (req, res) => {
    const csrfState = Math.random().toString(36).substring(7);
    const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=user.info.basic,video.upload,video.publish&response_type=code&redirect_uri=${REDIRECT_URI}&state=${csrfState}`;
    res.redirect(url);
});

// صفحة استقبال التوكن وعرضه لكِ
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send('لم يتم استلام الكود.');

    try {
        const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
            client_key: CLIENT_KEY,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const token = response.data.access_token;

        // --- هنا السحر: عرض التوكن في مربع كبير لنسخه ---
        res.send(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f0f2f5;">
                    <h1 style="color: green;">✅ مبروك! تم جلب التوكن</h1>
                    <p style="font-size: 18px;">انسخي هذا الكود الطويل وضعيه في ملف server.js (المتغير TIKTOK_ACCESS_TOKEN):</p>
                    <textarea style="width: 80%; height: 150px; font-size: 16px; padding: 10px; border-radius: 10px; border: 2px solid #ccc;">${token}</textarea>
                    <br><br>
                    <button onclick="document.querySelector('textarea').select();document.execCommand('copy');alert('تم النسخ!');" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #000; color: #fff; border: none; border-radius: 5px;">نسخ التوكن</button>
                </body>
            </html>
        `);

    } catch (error) {
        res.send('❌ حدث خطأ: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    }
});

app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل!`);
    console.log(`👉 اضغط هنا لتسجيل الدخول وجلب التوكن: http://localhost:${PORT}/login`);
});