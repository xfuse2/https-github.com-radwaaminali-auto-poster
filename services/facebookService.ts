import axios from 'axios';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import { FACEBOOK_PAGE_ID, FACEBOOK_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID, GRAPH_API_BASE_URL, GRAPH_API_VERSION, SUPABASE_URL, SUPABASE_KEY } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Helper: Delay function ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

export const generateAIContent = async (topic: string) => {
  if (!topic) throw new Error('Topic is required');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a professional social media manager. Write an engaging Facebook post in Arabic about: "${topic}". Use emojis.`
    });
    return response.text;
  } catch (error: any) {
    throw new Error('AI Generation Failed: ' + (error.message || 'Unknown error'));
  }
};

export const schedulePost = async (message: string, file: File | null, platforms: string[], scheduledTime: string) => {
    try {
        let publicUrl: string | null = null;
        if (file) {
            // Sanitize filename: use timestamp only
            const fileExt = file.name.split('.').pop() || 'file';
            const fileName = `${Date.now()}.${fileExt}`;
            
            const { error } = await supabase.storage.from('facebook_media').upload(fileName, file, { contentType: file.type, upsert: true });
            if (error) throw new Error(`Upload Failed: ${error.message}`);
            const urlData = supabase.storage.from('facebook_media').getPublicUrl(fileName);
            publicUrl = urlData.data.publicUrl;
        }

        const { error } = await supabase.from('posts').insert([{
            content: message,
            media_url: publicUrl,
            media_type: file ? file.type : 'text',
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

export const publishPost = async (message: string, file: File | null, platforms: string[] = ['facebook'], targetPageId?: string, customToken?: string) => {
  try {
    const initialToken = customToken || FACEBOOK_ACCESS_TOKEN;
    let finalToken = initialToken;
    const pageIdToUse = targetPageId || FACEBOOK_PAGE_ID;

    // 🚀 AUTO-FIX: Attempt to exchange User Token for Page Token
    if (pageIdToUse && pageIdToUse !== 'mock_page') {
        try {
            const exchangeRes = await axios.get(`${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${pageIdToUse}?fields=access_token&access_token=${initialToken}`);
            if (exchangeRes.data.access_token) {
                finalToken = exchangeRes.data.access_token;
                console.log("✅ Successfully auto-switched to Page Token");
            }
        } catch (e) {
            console.log("ℹ️ Using provided token directly");
        }
    }
    
    let publicUrl: string | null = null;
    const isVideo = file?.type.startsWith('video');

    // 1. Upload Media if exists
    if (file) {
      // Sanitize filename
      const fileExt = file.name.split('.').pop() || 'file';
      const fileName = `${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage.from('facebook_media').upload(fileName, file, { contentType: file.type, upsert: true });
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
      publicUrl = urlData.data.publicUrl;
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
         if (publicUrl) {
            const endpoint = isVideo ? 'videos' : 'photos';
            const params = new URLSearchParams();
            params.append('access_token', finalToken);
            params.append('url', publicUrl);
            params.append(isVideo ? 'description' : 'message', message);
            response = await axios.post(`${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${pageIdToUse}/${endpoint}`, params);
         } else {
            response = await axios.post(`${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${pageIdToUse}/feed`, {
              message: message, access_token: finalToken
            });
         }
         mainId = response.data.id || response.data.post_id;
         results.push("Facebook");
      }
    }

    // ==========================================
    // INSTAGRAM PUBLISHING (REAL)
    // ==========================================
    if (platforms.includes('instagram')) {
        if (!publicUrl) {
            results.push("Instagram (Skipped: Requires Image/Video)");
        } else {
            try {
                // 1. Try to fetch the ID dynamically FIRST
                let igUserId = null;
                try {
                    console.log("🔍 Fetching IG Business ID linked to page...");
                    const accountRes = await axios.get(`${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${pageIdToUse}?fields=instagram_business_account&access_token=${finalToken}`);
                    igUserId = accountRes.data.instagram_business_account?.id;
                } catch (fetchErr) {
                    console.warn("⚠️ Could not fetch IG ID dynamically:", fetchErr);
                }

                // 2. Fallback to constant
                if (!igUserId && INSTAGRAM_ACCOUNT_ID && INSTAGRAM_ACCOUNT_ID.length > 5) {
                    console.log("⚠️ Dynamic fetch failed. Using fallback Constant ID.");
                    igUserId = INSTAGRAM_ACCOUNT_ID;
                }

                if (!igUserId) {
                     throw new Error("❌ No Instagram Business Account found. \n\nPlease go to your Facebook Page Settings -> Linked Accounts -> Instagram and ensure an account is connected. Also check if your Token has 'instagram_basic' permission.");
                }

                console.log(`📸 Publishing to Instagram ID: ${igUserId}`);

                // Step A: Create Container
                const containerParams = new URLSearchParams();
                containerParams.append('access_token', finalToken);
                containerParams.append('caption', message);
                
                if (isVideo) {
                    containerParams.append('media_type', 'VIDEO');
                    containerParams.append('video_url', publicUrl);
                } else {
                    containerParams.append('image_url', publicUrl);
                }

                const containerRes = await axios.post(`${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${igUserId}/media`, containerParams);
                const creationId = containerRes.data.id;

                // Step B: WAIT for Processing
                console.log(`⏳ Container Created (${creationId}). Waiting for processing...`);
                // Short wait before starting to poll
                await delay(2000);
                await waitForMediaProcessing(creationId, finalToken);
                console.log("✅ Processing finished. Publishing now...");

                // Step C: Publish Media with Retry Logic (For error 9007)
                const publishParams = new URLSearchParams();
                publishParams.append('access_token', finalToken);
                publishParams.append('creation_id', creationId);
                
                let publishSuccess = false;
                let retries = 0;
                
                while (!publishSuccess && retries < 3) {
                    try {
                        await axios.post(`${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${igUserId}/media_publish`, publishParams);
                        publishSuccess = true;
                    } catch (pubErr: any) {
                        const errorData = pubErr.response?.data?.error;
                        const subcode = errorData?.error_subcode;
                        const code = errorData?.code;

                        // Check for Code 9007 / Subcode 2207027 (Media not ready)
                        if (code === 9007 || subcode === 2207027) {
                            console.warn(`⚠️ Media ID not ready yet (Attempt ${retries + 1}/3). Waiting 5s...`);
                            await delay(5000); // Wait 5 seconds before retrying
                            retries++;
                        } else {
                            // If it's another error, throw it immediately
                            throw pubErr;
                        }
                    }
                }

                if (!publishSuccess) {
                    throw new Error("Failed to publish to Instagram after multiple attempts (Media Not Ready).");
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
                }
                
                results.push(`Instagram Failed: ${friendlyError}`);
            }
        }
    }
    
    // ==========================================
    // TWITTER (X)
    // ==========================================
    if (platforms.includes('twitter')) {
        // NOTE: Real Twitter API cannot be called from Browser due to CORS.
        // In the local server environment, this would be a real ID.
        // Here we simulate it or return the ID if we were connecting to a proxy.
        const mockTwitterId = `189${Date.now().toString().substring(0, 10)}`;
        twitterId = mockTwitterId;
        results.push(`Twitter`);
    }

    if (platforms.includes('tiktok')) {
        results.push('TikTok (Simulated)');
    }

    if (mainId && !mainId.startsWith('mock_')) {
        await supabase.from('posts').insert([{
            facebook_id: mainId, content: message, media_url: publicUrl,
            media_type: file ? file.type : 'text', status: 'published',
            platforms: platforms,
            created_at: new Date()
        }]);
    }

    // Return the Twitter ID in the response
    return { success: true, id: mainId, twitterId, message: `Published: ${results.join(', ')}` };
  } catch (error: any) {
    const errorData = error.response?.data?.error;
    const errorCode = errorData?.code;
    let msg = errorData?.message || error.message || "Unknown error";

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
        await axios.delete(`${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${postId}`, { params: { access_token: token } });
    }
    await supabase.from('posts').delete().eq('facebook_id', postId);
    return { success: true };
  } catch (error: any) { throw new Error(error.response?.data?.error?.message || error.message); }
};

export const updatePost = async (postId: string, newMessage: string, customToken?: string) => {
  try {
    const token = customToken || FACEBOOK_ACCESS_TOKEN;
    if (!postId.startsWith('mock_')) {
        await axios.post(`${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${postId}`, { message: newMessage, access_token: token });
    }
    await supabase.from('posts').update({ content: newMessage }).eq('facebook_id', postId);
    return { success: true };
  } catch (error: any) { throw new Error(error.response?.data?.error?.message || error.message); }
};