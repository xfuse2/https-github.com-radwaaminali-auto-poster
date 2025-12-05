const { TwitterApi } = require('twitter-api-v2');

async function postTweet() {
  console.log('🚀 جاري الاتصال بتويتر...');

  const client = new TwitterApi({
    appKey: 'Cty1K5107L65apjLNrsfDUSvG',
    appSecret: '7MLJJKyZROJboQIWiii7h2x8VmBFc9Kp1xPATe5ubOy8vpByaO',
    accessToken: '1996499677689352192-CMmMaZGkp6dUh0SPnaXLbX7kHkiwtQ',
    accessSecret: 'b6TCvRDd8KVVxJ1gxd3x8fRZlI3kc2Bw2L98E8ObNSaU1',
  });

  try {
    const rwClient = client.readWrite;
    
    // نضيف التوقيت الحالي للنص لتجنب رفض تويتر للتغريدات المكررة
    const tweetText = 'تغريدة تجريبية من AutoPoster 🤖\n' + new Date().toLocaleString('ar-EG');
    
    console.log(`📝 محاولة نشر: "${tweetText}"`);

    const tweet = await rwClient.v2.tweet(tweetText);

    console.log('------------------------------------------------');
    console.log('✅ تم النشر بنجاح على تويتر!');
    console.log('🆔 رقم التغريدة (ID):', tweet.data.id);
    console.log('📄 النص المنشور:', tweet.data.text);
    console.log('🔗 رابط التغريدة: https://x.com/i/web/status/' + tweet.data.id);
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ فشل النشر على تويتر:');
    if (error.code === 403) {
        console.error('⚠️ خطأ 403: تأكد من أن حساب المطور لديه صلاحيات (Read and Write) وليس (Read Only).');
        console.error('   اذهب لـ Developer Portal -> User authentication settings -> App permissions');
    } else if (error.code === 401) {
        console.error('⚠️ خطأ 401: المفاتيح غير صحيحة أو التوكن منتهي.');
    } else {
        console.error(error);
    }
  }
}

postTweet();