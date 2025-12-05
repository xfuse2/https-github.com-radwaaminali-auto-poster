const { TwitterApi } = require('twitter-api-v2');

async function getLastTweet() {
  const client = new TwitterApi({
    appKey: 'Cty1K5107L65apjLNrsfDUSvG',
    appSecret: '7MLJJKyZROJboQIWiii7h2x8VmBFc9Kp1xPATe5ubOy8vpByaO',
    accessToken: '1996499677689352192-CMmMaZGkp6dUh0SPnaXLbX7kHkiwtQ',
    accessSecret: 'b6TCvRDd8KVVxJ1gxd3x8fRZlI3kc2Bw2L98E8ObNSaU1',
  });

  try {
    // 1. معرفة المستخدم الحالي (صاحب التوكن)
    const user = await client.v2.me();
    console.log(`👤 جاري البحث في حساب: @${user.data.username}`);

    // 2. جلب آخر تغريدة
    const tweets = await client.v2.userTimeline(user.data.id, { max_results: 1 });
    
    if (tweets.data.data && tweets.data.data.length > 0) {
        const lastTweet = tweets.data.data[0];
        console.log('------------------------------------------------');
        console.log('✅ آخر تغريدة تم العثور عليها:');
        console.log('🆔 رقم التغريدة (ID):', lastTweet.id);
        console.log('📄 النص:', lastTweet.text);
        console.log('------------------------------------------------');
    } else {
        console.log('⚠️ لا توجد تغريدات في هذا الحساب.');
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

getLastTweet();