import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { publishPost } from '../services/facebookService';
import { SUPABASE_URL, SUPABASE_KEY } from '../constants';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// كل دقيقة
cron.schedule('* * * * *', async () => {
  console.log('⏰ Running scheduler...');

  const nowIso = new Date().toISOString();

  // 1) هات كل البوستات اللي وقتها فات وحالتها مجدولة
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso);

  if (error) {
    console.error('Error loading scheduled posts:', error.message);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('No scheduled posts to publish.');
    return;
  }

  for (const post of posts) {
    try {
      console.log(`🚀 Publishing post id=${post.id} ...`);

      // platforms عمود عندك في الجداول (type: text[])
      const platforms: string[] = post.platforms || ['facebook'];

      const res = await publishPost(
        post.content,
        null,             // مفيش ملفات من الجهاز (إحنا مجدولين نص بس)
        platforms,
        post.media_url || null, // لو فيه media_url من الجدولة
        undefined,
        undefined          // هنستخدم التوكن من constants أو من الإعدادات لو عدلتها هناك
      );

      // 2) لو النشر نجح -> حدث نفس الصف
      await supabase
        .from('posts')
        .update({
          status: 'published',
          facebook_id: res.id || post.facebook_id,
        })
        .eq('id', post.id);

      console.log(`✅ Post id=${post.id} published & status updated`);
    } catch (e: any) {
      console.error(`❌ Failed to publish post id=${post.id}:`, e.message);

      // اختياري: تخزين حالة فشل
      await supabase
        .from('posts')
        .update({ status: 'failed' })
        .eq('id', post.id);
    }
  }
});

console.log('📦 Scheduler started');
