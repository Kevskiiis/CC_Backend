import { ErrorHandler } from "../../objects/errorHandler.js";
import { imageUploader } from "../../imageHandlers/imageUploader.js";
import { imageRemover } from "../../imageHandlers/imageRemover.js";

export async function createAnnouncement (communityID, communityName, profileID, announcementTitle, announcementDescription, announcementRole, announcementImage = null, supabaseClient) {
    //Step 1: Insert new community post: 
    const { data: announcementData, error: announcementError } = await supabaseClient
    .from('community_announcements')
    .insert([{
        community_id: communityID,
        profile_id: profileID,
        announcement_title: announcementTitle,
        announcement_description: announcementDescription,
        attachment_url: null,
        announcement_role: announcementRole
    }])
    .select();

    if (announcementError) {
        throw new ErrorHandler("Error uploading a community post. Try again.", 500);
    }

    const announcement = announcementData[0];

    // If a file was intended to be intered and it fails to upload, handle:
    const filePath = announcementImage != null ? `${communityName.toLowerCase().trim()}/community_announcement_images/${announcement.announcement_id}-${announcementImage.originalname}` : null;
    if (filePath !== null) {
        await imageUploader("communities",filePath, announcementImage);
    }

    // Upload Image URL into the community posts:
    const { data: urlData, error: urlError } = await supabaseClient
    .from('community_announcements')
    .update({
        attachment_url: filePath
    })
    .eq("announcement_id", announcement.announcement_id)
    .select();

    if (urlError) {
        await imageRemover("communities", filePath);
        throw new ErrorHandler("There was an error updating the url data.")
    }

    return {
        success: true,
        post: announcement
    }
}