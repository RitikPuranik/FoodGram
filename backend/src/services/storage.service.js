const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadFile(file, fileName) {
    const result = await imagekit.upload({
        file: file, // required
        fileName: fileName, // required
    })

    return result; // Return the full result (includes fileId for deletion)
}

/**
 * Delete a file from ImageKit by its fileId.
 * Pass the fileId returned by uploadFile (result.fileId).
 * Safe to call — errors are caught and logged, never thrown.
 */
async function deleteFile(fileId) {
    if (!fileId) return;
    try {
        await imagekit.deleteFile(fileId);
    } catch (err) {
        console.error('ImageKit deleteFile error:', err.message);
    }
}

/**
 * Extract the ImageKit fileId from a stored URL.
 * ImageKit URLs contain the fileId as the last path segment before the filename,
 * but the reliable way is to list files by URL and get the fileId.
 * We store fileId alongside the URL in the DB — this helper is a fallback
 * that searches by URL if only the URL is available.
 */
async function getFileIdByUrl(url) {
    if (!url) return null;
    try {
        // ImageKit list API — search by name derived from URL
        const fileName = url.split('/').pop();
        const files = await imagekit.listFiles({ name: fileName, limit: 1 });
        return files?.[0]?.fileId || null;
    } catch (err) {
        console.error('ImageKit getFileIdByUrl error:', err.message);
        return null;
    }
}

module.exports = {
    uploadFile,
    deleteFile,
    getFileIdByUrl
}