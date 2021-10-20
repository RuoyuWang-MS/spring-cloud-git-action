"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToSasUrl = void 0;
const storage_file_share_1 = require("@azure/storage-file-share");
function uploadFileToSasUrl(uploadUrl, localPath) {
    return __awaiter(this, void 0, void 0, function* () {
        console.debug('uploading file to URL: ' + uploadUrl);
        const shareFileClient = new storage_file_share_1.ShareFileClient(uploadUrl, new storage_file_share_1.AnonymousCredential());
        try {
            console.info('StartingUploadOf' + localPath);
            yield shareFileClient.uploadFile(localPath, {
                onProgress: (ev) => console.log(ev)
            });
            console.info('CompletedUploadOf' + localPath);
        }
        catch (err) {
            throw err;
        }
    });
}
exports.uploadFileToSasUrl = uploadFileToSasUrl;
