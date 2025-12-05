const axios = require('axios');
const fs = require('fs');

// ============================================================
// ⚠️ هام جداً: ضعي التوكن الذي نسختيه من التيرمينال هنا
// ============================================================
const ACCESS_TOKEN = 'PASTE_YOUR_TIKTOK_TOKEN_HERE'; 

// مسار الفيديو (تأكد من وجود ملف video.mp4 بجوار هذا الملف)
const FILE_PATH = './video.mp4'; 

async function publishVideo() {
    try {
        // التحقق من التوكن
        if (ACCESS_TOKEN === 'PASTE_YOUR_TIKTOK_TOKEN_HERE' || !ACCESS_TOKEN) {
            console.error('❌ خطأ: لم تقم بوضع التوكن في الكود!');
            console.error('   يرجى تشغيل node tiktok-auth.js أولاً ونسخ التوكن.');
            return;
        }

        // التحقق من الملف
        if (!fs.existsSync(FILE_PATH)) {
            console.error('❌ خطأ: لم يتم العثور على ملف video.mp4');
            return;
        }

        console.log('1️⃣ جاري قراءة ملف الفيديو...');
        const fileStats = fs.statSync(FILE_PATH);
        const fileSize = fileStats.size;

        console.log('2️⃣ بدء عملية الرفع (Initialisation)...');
        // الخطوة 1: طلب رابط رفع
        const initResponse = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', {
            post_info: {
                title: "تم النشر عبر AutoPoster 🚀",
                // ⚠️ هام: SELF_ONLY يعني أن الفيديو سيظهر في تبويب "القفل" (خاص)
                // لتغييره لعام، استخدم "PUBLIC_TO_EVERYONE" (قد يتطلب مراجعة من تيك توك)
                privacy_level: "SELF_ONLY", 
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
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json; charset=UTF-8'
            }
        });

        const uploadUrl = initResponse.data.data.upload_url;
        console.log('✅ تم استلام رابط الرفع.');

        // الخطوة 2: الرفع الفعلي
        console.log('3️⃣ جاري رفع الفيديو (يرجى الانتظار)...');
        const videoStream = fs.createReadStream(FILE_PATH);
        
        await axios.put(uploadUrl, videoStream, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Length': fileSize
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('------------------------------------------------');
        console.log('🎉 تم الرفع بنجاح!');
        console.log('📍 أين الفيديو؟');
        console.log('   1. افتح تطبيق تيك توك.');
        console.log('   2. اذهب إلى صفحتك الشخصية.');
        console.log('   3. اضغط على أيقونة القفل 🔒 (وليس الصفحة الرئيسية).');
        console.log('   4. ستجد الفيديو هناك لأنه نُشر بوضع "خاص".');
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('❌ حدث خطأ:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

publishVideo();