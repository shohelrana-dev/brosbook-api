"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Media_1 = tslib_1.__importDefault(require("../entities/Media"));
const is_empty_1 = tslib_1.__importDefault(require("is-empty"));
const data_source_1 = require("../../../config/data-source");
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
class MediaService {
    constructor() {
        this.repository = data_source_1.appDataSource.getRepository(Media_1.default);
    }
    async save({ file, creatorId, source }) {
        if ((0, is_empty_1.default)(file))
            throw new Error('File is empty.');
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.upload_stream({
                resource_type: "image",
                folder: "brosbook",
                quality: 'auto:low',
                width: 1920,
                crop: "limit"
            }, async (err, result) => {
                if (err)
                    reject(err);
                const media = new Media_1.default();
                media.url = result.secure_url;
                media.format = result.format;
                media.name = result.public_id;
                media.width = result.width;
                media.height = result.height;
                media.size = result.bytes;
                media.source = source;
                media.creatorId = creatorId;
                await this.repository.save(media);
                resolve(media);
            }).end(file);
        });
    }
    async delete(mediaId) {
        if (!mediaId)
            throw new Error('Media id is empty.');
        const media = await this.repository.findOneBy({ id: mediaId });
        if (!media)
            throw new Error('Media doesn\'t exists.');
        await cloudinary_1.v2.uploader.destroy(media.name);
        await this.repository.delete({ id: mediaId });
        return media;
    }
}
exports.default = MediaService;
//# sourceMappingURL=media.service.js.map