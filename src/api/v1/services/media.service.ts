import Media from "@entities/Media"
import { UploadedFile } from "express-fileupload"
import isEmpty from "is-empty"
import { MediaSource } from "@entities/Media"
import User from "@entities/User"
import { appDataSource } from "@config/data-source"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config( {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
} )

interface SaveMedia {
    file: UploadedFile
    creator: Partial<User>
    source: MediaSource
}

export default class MediaService {
    public readonly repository = appDataSource.getRepository( Media )

    async save( { file, creator, source }: SaveMedia ): Promise<Media>{
        if( isEmpty( file ) ) throw new Error( 'File is empty.' )

        return new Promise( ( resolve, reject ) => {
            cloudinary.uploader.upload_stream( {
                resource_type: "image",
                folder: "brosbook",
                quality: 'auto:low',
                width: 1920,
                crop: "limit"
            }, async( err, result ) => {
                if( err ) reject( err )

                const media        = new Media()
                media.url          = result.secure_url
                media.format       = result.format
                media.name         = result.public_id
                media.originalName = file.name
                media.width        = result.width
                media.height       = result.height
                media.size         = result.bytes
                media.source       = source
                media.creator      = creator as User
                await this.repository.save( media )

                resolve( media )
            } ).end( file.data )
        } )
    }

    async delete( mediaId: string ): Promise<Media>{
        if( ! mediaId ) throw new Error( 'Media id is empty.' )

        const media = await this.repository.findOneBy( { id: mediaId } )

        if( ! media ) throw new Error( 'Media doesn\'t exists.' )

        await cloudinary.uploader.destroy( media.name )

        await this.repository.delete( { id: mediaId } )

        return media
    }
}