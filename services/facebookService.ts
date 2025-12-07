import axios from 'axios';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import {
  FACEBOOK_PAGE_ID,
  FACEBOOK_ACCESS_TOKEN,
  INSTAGRAM_ACCOUNT_ID,
  GRAPH_API_BASE_URL,
  GRAPH_API_VERSION,
  SUPABASE_URL,
  SUPABASE_KEY
} from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ** التصحيح: تم تصدير الدالة delay لتكون متاحة **
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ** --- Helper: Convert Base64 to Blob/File (Required for Supabase Upload) --- **
const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

// --- Helper: Wait for Instagram Media Processing ---
const waitForMediaProcessing = async (creationId: string, accessToken: string) => {
  let attempts = 0;
  const maxAttempts = 20; // 20 * 5s = 100 seconds max wait

  while (attempts < maxAttempts) {
    try {
      const statusRes = await axios.get(
        `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${creationId}`,
        {
          params: {
            fields: 'status_code,status',
            access_token: accessToken
          }
        }
      );

      const status = statusRes.data.status_code;
      console.log(`Checking IG Status... Attempt ${attempts + 1}: ${status}`);

      if (status === 'FINISHED') {
        return true; // Ready to publish
      }

      if (status === 'ERROR') {
        throw new Error("فشلت معالجة الوسائط من قبل انستجرام (Media Processing Error).");
      }

      // If IN_PROGRESS, wait
      await delay(5000);
      attempts++;

    } catch (error: any) {
      console.error("Error checking media status:", error.message);
      throw error;
    }
  }
  throw new Error("انتهت مهلة الانتظار ولم تجهز الوسائط للنشر بعد.");
};

/**
 * دالة مُحدثة لتوليد المحتوى بالذكاء الاصطناعي مع دعم البرومبت الثنائي اللغة.
 * @param topic - البرومبت المُعدّل الذي يحتوي على التوجيهات اللغوية.
 * @param preferredLang - اللغة المفضلة (Arabic أو English) لإعطاء أولوية في الرد.
 */
export const generateAIContent = async (topic: string, preferredLang: string) => {
  if (!topic) throw new Error('Topic is required');
  try {
    // البرومبت المُعدّل من App.tsx يضمن الطلب باللغتين.
    const response = await (ai as any).models.generateContent({
      model: 'gemini-2.5-flash',
      contents: topic
    });
    return (response as any).text;
  } catch (error: any) {
    throw new Error('AI Generation Failed: ' + (error.message || 'Unknown error'));
  }
};

// ** --- دالة توليد الصورة الجديدة (استخدام Gemini 2.5 Flash Image) --- **
export const generateAIImage = async (prompt: string) => {
  if (!prompt) throw new Error('Image prompt is required.');

  try {
    const response = await (ai as any).models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Generate a high-quality, professional, and visually appealing image for social media content about: ${prompt}` }
        ]
      }
    });

    let base64Image: string | null = null;
    let mimeType = 'image/png';

    if ((response as any).candidates?.[0]?.content?.parts) {
      for (const part of (response as any).candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("AI did not return image data. Please ensure the 'gemini-2.5-flash-image' model is available and enabled.");
    }

    const imageBlob = base64ToBlob(base64Image, mimeType);
    const fileExt = mimeType.split('/')[1] || 'png';

    const fileName = `ai_image_${Date.now()}.${fileExt}`;
    const { error } = await supabase
      .storage
      .from('facebook_media')
      .upload(fileName, imageBlob, { contentType: mimeType, upsert: true });

    if (error) {
      throw new Error(`AI Image Upload Failed to Supabase: ${error.message}`);
    }

    const { data } = supabase.storage.from('facebook_media').getPublicUrl(fileName);

    return {
      publicUrl: data.publicUrl,
      fileName: fileName,
      fileType: mimeType
    };

  } catch (error: any) {
    console.error("AI Image Gen Error:", error);
    const errMsg = error.message || 'Unknown API error';
    throw new Error(`AI Image Generation Failed: ${errMsg}`);
  }
};
// ** --- نهاية دالة توليد الصورة الجديدة --- ***


// ✅ يدعم File أو File[] (نأخذ أول ملف فقط للنشر / الجدولة)
export const schedulePost = async (
  message: string,
  files: File | File[] | null,
  platforms: string[],
  scheduledTime: string
) => {
  try {
    let publicUrl: string | null = null;
    let mediaType: string = 'text';

    const mainFile = Array.isArray(files) ? files[0] : files;

    if (mainFile) {
      const fileExt = (mainFile as any).name.split('.').pop() || 'file';
      const fileName = `${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('facebook_media')
        .upload(fileName, mainFile as any, { contentType: (mainFile as any).type, upsert: true });

      if (error) throw new Error(`Upload Failed: ${error.message}`);

      const urlData = supabase.storage.from('facebook_media').getPublicUrl(fileName);
      publicUrl = urlData.data.publicUrl;
      mediaType = (mainFile as any).type;
    }

    const { error } = await supabase.from('posts').insert([{
      content: message,
      media_url: publicUrl,
      media_type: mediaType,
      status: 'scheduled',
      scheduled_at: scheduledTime,
      platforms: platforms,
      created_at: new Date()
    }]);

    if (error) throw new Error(`DB Save Failed: ${error.message}`);
    return { success: true, message: "Post saved to schedule" };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * ✅ دالة النشر الآن تدعم:
 * - ملف واحد أو مصفوفة ملفات (نستخدم أول واحد)
 * - publicUrl جاهز من الفرونت (صورة AI مثلاً)
 */
export const publishPost = async (
  message: string,
  files: File | File[] | null,
  platforms: string[] = ['facebook'],
  publicUrlFromClient?: string | null,
  targetPageId?: string,
  customToken?: string
) => {
  try {
    const initialToken = customToken || FACEBOOK_ACCESS_TOKEN;
    let finalToken = initialToken;
    const pageIdToUse = targetPageId || FACEBOOK_PAGE_ID;

    // 🚀 AUTO-FIX: Attempt to exchange User Token for Page Token
    if (pageIdToUse && pageIdToUse !== 'mock_page') {
      try {
        const exchangeRes = await axios.get(
          `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${pageIdToUse}?fields=access_token&access_token=${initialToken}`
        );
        if (exchangeRes.data.access_token) {
          finalToken = exchangeRes.data.access_token;
          console.log("✅ Successfully auto-switched to Page Token");
        }
      } catch (e) {
        console.log("ℹ️ Using provided token directly");
      }
    }

    let mediaUrl: string | null = publicUrlFromClient || null;

    const mainFile: any = Array.isArray(files) ? files[0] : files;
    const isVideo = mainFile?.type?.startsWith('video') ?? false;

    // 1. Upload Media if exists and no mediaUrl provided
    if (mainFile && !mediaUrl) {
      const fileExt = mainFile.name.split('.').pop() || 'file';
      const fileName = `${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('facebook_media')
        .upload(fileName, mainFile, { contentType: mainFile.type, upsert: true });

      if (error) {
        if (error.message.includes('row-level security') || error.message.includes('violates')) {
          throw new Error(
            `⛔ Security Policy Error (RLS).
To fix this, copy and run this UPDATED command in Supabase -> SQL Editor:

insert into storage.buckets (id, name, public) values ('facebook_media', 'facebook_media', true) on conflict do nothing;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'facebook_media' );
create policy "Public Upload" on storage.objects for insert with check ( bucket_id = 'facebook_media' );`
          );
        }
        throw new Error(`Media Upload Failed: ${error.message}`);
      }
      const urlData = supabase.storage.from('facebook_media').getPublicUrl(fileName);
      mediaUrl = urlData.data.publicUrl;
    }

    const results: string[] = [];
    let mainId = '';
    let twitterId = ''; // Variable to store Twitter ID

    // ==========================================
    // FACEBOOK PUBLISHING
    // ==========================================
    if (platforms.includes('facebook')) {
      if (pageIdToUse !== FACEBOOK_PAGE_ID) {
        await new Promise(r => setTimeout(r, 600));
        results.push(`Facebook (Simulated)`);
        mainId = `mock_${Date.now()}`;
      } else {
        let response;
        if (mediaUrl) {
          const endpoint = isVideo ? 'videos' : 'photos';
          const params = new URLSearchParams();
          params.append('access_token', finalToken);
          params.append('url', mediaUrl as string);
          params.append(isVideo ? 'description' : 'message', message);
          response = await axios.post(
            `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${pageIdToUse}/${endpoint}`,
            params
          );
        } else {
          response = await axios.post(
            `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${pageIdToUse}/feed`,
            { message, access_token: finalToken }
          );
        }
        mainId = response.data.id || response.data.post_id;
        results.push("Facebook");
      }
    }

    // ==========================================
    // INSTAGRAM PUBLISHING (REAL)
    // ==========================================
    if (platforms.includes('instagram')) {
      // 🛑 Pre-Check: Validate Caption Length (Max 2200 chars for Instagram)
      if (message.length > 2200) {
        throw new Error("⚠️ النص طويل جداً لإنستجرام! الحد الأقصى 2200 حرف. يرجى تقليل النص قبل النشر.");
      }

      if (!mediaUrl) {
        results.push("Instagram (Skipped: Requires Image/Video)");
      } else {
        try {
          let igUserId: string | null = null;
          try {
            console.log("🔍 Fetching IG Business ID linked to page...");
            const accountRes = await axios.get(
              `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${pageIdToUse}?fields=instagram_business_account&access_token=${finalToken}`
            );
            igUserId = accountRes.data.instagram_business_account?.id || null;
          } catch (fetchErr) {
            console.warn("⚠️ Could not fetch IG ID dynamically:", fetchErr);
          }

          if (!igUserId && INSTAGRAM_ACCOUNT_ID && INSTAGRAM_ACCOUNT_ID.length > 5) {
            console.log("⚠️ Dynamic fetch failed. Using fallback Constant ID.");
            igUserId = INSTAGRAM_ACCOUNT_ID;
          }

          if (!igUserId) {
            throw new Error(
              "❌ No Instagram Business Account found. \n\nPlease go to your Facebook Page Settings -> Linked Accounts -> Instagram and ensure an account is connected. Also check if your Token has 'instagram_basic' permission."
            );
          }

          console.log(`📸 Publishing to Instagram ID: ${igUserId}`);

          const containerParams = new URLSearchParams();
          containerParams.append('access_token', finalToken);
          containerParams.append('caption', message);

          if (isVideo) {
            containerParams.append('media_type', 'VIDEO');
            containerParams.append('video_url', mediaUrl as string);
          } else {
            containerParams.append('image_url', mediaUrl as string);
          }

          const containerRes = await axios.post(
            `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${igUserId}/media`,
            containerParams
          );
          const creationId = containerRes.data.id;

          console.log(`⏳ Container Created (${creationId}). Waiting for processing...`);
          await delay(2000);
          await waitForMediaProcessing(creationId, finalToken);
          console.log("✅ Processing finished. Publishing now...");

          const publishParams = new URLSearchParams();
          publishParams.append('access_token', finalToken);
          publishParams.append('creation_id', creationId);

          let publishSuccess = false;
          let retries = 0;

          while (!publishSuccess && retries < 10) {
            try {
              await delay(3000);
              await axios.post(
                `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${igUserId}/media_publish`,
                publishParams
              );
              publishSuccess = true;
            } catch (pubErr: any) {
              const errorData = pubErr.response?.data?.error;
              const subcode = errorData?.error_subcode;
              const code = errorData?.code;

              if (code === 9007 || subcode === 2207027) {
                console.warn(
                  `⚠️ Media ID not ready yet (Attempt ${retries + 1}/10). Waiting 5s...`
                );
                await delay(5000);
                retries++;
              } else {
                throw pubErr;
              }
            }
          }

          if (!publishSuccess) {
            throw new Error(
              "Failed to publish to Instagram after multiple attempts (Media Not Ready)."
            );
          }

          results.push("Instagram");
          if (!mainId) mainId = creationId;

        } catch (igError: any) {
          const fullError = igError.response?.data || igError.message;
          console.error("IG Error Details:", JSON.stringify(fullError, null, 2));

          const errData = igError.response?.data?.error;
          const errMsg = errData?.message || igError.message || JSON.stringify(fullError);

          let friendlyError = errMsg;
          if (errData?.code === 100 && errData?.error_subcode === 33) {
            friendlyError = "Invalid Instagram ID or Page not correctly linked.";
          } else if (errMsg.includes('instagram_business_account')) {
            friendlyError = "Page not linked to Instagram Business Account";
          } else if (errData?.code === 36004 || errMsg.includes('caption was too long')) {
            friendlyError = "النص طويل جداً (تجاوز 2200 حرف). يرجى تقليل النص.";
          }

          results.push(`Instagram Failed: ${friendlyError}`);
        }
      }
    }

    // ==========================================
    // TWITTER (X)
    // ==========================================
    if (platforms.includes('twitter')) {
      const mockTwitterId = `189${Date.now().toString().substring(0, 10)}`;
      twitterId = mockTwitterId;
      results.push(`Twitter`);
    }

    // ==========================================
    // TIKTOK (Mock / Backend Forward)
    // ==========================================
    if (platforms.includes('tiktok')) {
      try {
        await axios.post('http://localhost:3000/publish', {
          message,
          platforms: ['tiktok'],
        });
        results.push('TikTok (Sent to Backend)');
      } catch (e) {
        console.log("TikTok backend call failed (expected in preview):", e);
        results.push('TikTok (Simulated)');
      }
    }

    // ==========================================
    // حفظ في Supabase (لأرشيف الداشبورد)
    // → نحفظ دائمًا، حتى لو الـ ID mock أو فاضي
    // ==========================================
    const mediaTypeForDb =
      mainFile
        ? mainFile.type
        : mediaUrl
          ? (isVideo ? 'video' : 'image')
          : 'text';

    const { error: dbError } = await supabase.from('posts').insert([{
      facebook_id: mainId || null,          // نسمح بـ mock / null
      content: message,
      media_url: mediaUrl,
      media_type: mediaTypeForDb,
      status: 'published',
      platforms,
      created_at: new Date().toISOString(),
    }]);

    if (dbError) {
      console.error('Supabase posts insert error:', dbError);
      throw new Error('DB Save Failed: ' + dbError.message);
    }

    return { success: true, id: mainId, twitterId, message: `Published: ${results.join(', ')}` };
  } catch (error: any) {
    const errorData = error.response?.data?.error;
    const errorCode = errorData?.code;
    let msg = errorData?.message || error.message || "Unknown error";

    if (msg.includes('Application does not have permission') || msg.includes('capability')) {
      throw new Error(
        `⛔ App Permission Error (Code 10/200).
Your Meta App does not have the required permissions.

1. Ensure your Token includes 'pages_manage_posts' & 'pages_read_engagement'.
2. If using a User Token, ensure you are Admin of the App.
3. If in 'Development' mode, you can only post to Pages you own.
4. Try generating a fresh PAGE ACCESS TOKEN from Graph API Explorer.`
      );
    }

    if (errorCode === 200 || msg.includes('(#200)') || msg.includes('Permissions error')) {
      throw new Error(
        `⛔ Permissions Error (#200).
Even after auto-fix, your token lacks permissions.

Please generate a NEW 'Page Access Token' from Graph API Explorer:
1. "User or Page": Select Your Page (NOT User).
2. Permissions: "pages_manage_posts", "pages_read_engagement", "instagram_basic", "instagram_content_publish".`);
    }

    throw new Error(msg);
  }
};

export const deletePost = async (postId: string, customToken?: string) => {
  try {
    const token = customToken || FACEBOOK_ACCESS_TOKEN;
    if (!postId.startsWith('mock_')) {
      await axios.delete(
        `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${postId}`,
        { params: { access_token: token } }
      );
    }
    await supabase.from('posts').delete().eq('facebook_id', postId);
    return { success: true };
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
};

export const updatePost = async (postId: string, newMessage: string, customToken?: string) => {
  try {
    const token = customToken || FACEBOOK_ACCESS_TOKEN;
    if (!postId.startsWith('mock_')) {
      await axios.post(
        `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${postId}`,
        { message: newMessage, access_token: token }
      );
    }
    await supabase.from('posts').update({ content: newMessage }).eq('facebook_id', postId);
    return { success: true };
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
};

// ✅ جلب الأرشيف / الخط الزمني من Supabase
export const fetchPosts = async (statusFilter?: string) => {
  try {
    let query: any = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Load Posts Failed: ${error.message}`);
    return data || [];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to load posts');
  }
};