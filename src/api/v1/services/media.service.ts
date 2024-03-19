import { appDataSource } from '@config/datasource.config'
import Media, { MediaSource } from '@entities/Media'
import User from '@entities/User'
import { Auth } from '@utils/types'
import { v2 as cloudinary } from 'cloudinary'
import { injectable } from 'inversify'
import isEmpty from 'is-empty'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

interface SaveMedia {
    file: Buffer
    creator: Auth['user']
    source: MediaSource
}

@injectable()
export default class MediaService {
    private readonly mediaRepository = appDataSource.getRepository(Media)

    public async save({ file, creator, source }: SaveMedia): Promise<Media> {
        if (isEmpty(file)) throw new Error('File is empty.')

        return new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        resource_type: 'image',
                        folder: 'brosbook',
                        quality: 'auto:low',
                        width: 1920,
                        crop: 'limit',
                    },
                    async (err, result) => {
                        if (err) return reject(err)

                        const media = new Media()
                        media.url = result.secure_url
                        media.format = result.format
                        media.name = result.public_id
                        media.width = result.width
                        media.height = result.height
                        media.size = result.bytes
                        media.source = source
                        media.creator = creator as User

                        await this.mediaRepository.save(media)

                        resolve(media)
                    }
                )
                .end(file)
        })
    }

    public async delete(mediaId: string): Promise<Media> {
        if (!mediaId) throw new Error('Media id is empty.')

        const media = await this.mediaRepository.findOneBy({ id: mediaId })

        if (!media) throw new Error('Media does not exists.')

        await cloudinary.uploader.destroy(media.name)

        await this.mediaRepository.delete({ id: mediaId })

        return media
    }
}
