
import { ShareFileClient, AnonymousCredential } from '@azure/storage-file-share';

export async function uploadFileToSasUrl(uploadUrl: string, localPath: string) {
    console.debug('uploading file to URL: ' + uploadUrl);
    const shareFileClient = new ShareFileClient(uploadUrl, new AnonymousCredential());
    try {
        console.info('StartingUploadOf' + localPath);
        await shareFileClient.uploadFile(localPath, {
            onProgress: (ev) => console.log(ev)
        });
        console.info('CompletedUploadOf' + localPath);
    } catch (err) {
        throw err;
    }
}

