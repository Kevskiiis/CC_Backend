import { supabase } from "../api/supabase/globalSupabaseClient.js";
import { getSupabaseUserClient } from "../api/supabase/localSupabaseClient.js";

export async function imageUploader (filePath, image, accessToken) {
    const supabaseUser = await getSupabaseUserClient(accessToken); 

    console.log(supabaseUser);

    // console.log(image);
    // Upload file to bucket:
    // console.log(accessToken);
    const { data, error } = await supabaseUser.storage
    .from('profiles')
    .upload(filePath, image.buffer, {
      contentType: image.mimetype,
      upsert: true // overwrite if exists
    });

    console.log(error);

    if (error) {
        return {
            success: false,
            message: 'Failed to upload the image.'
        }
    }

    return {
        success: true,
        message: 'Image was uploaded correcttly!'
    }
}