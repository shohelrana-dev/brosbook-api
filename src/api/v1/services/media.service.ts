import fs from "fs"
import Media from "@entities/Media"
import { UploadedFile } from "express-fileupload"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import isEmpty from "is-empty"
import { MediaSource } from "@entities/Media"
import User from "@entities/User"
import { appDataSource } from "@config/data-source"
import appRootPath from "app-root-path"

interface SaveMedia {
    file: UploadedFile
    creator: Partial<User>
    source: MediaSource
}

export default class MediaService {
    public readonly repository = appDataSource.getRepository( Media )

    async save( { file, creator, source }: SaveMedia ): Promise<Media>{
        if( isEmpty( file ) ) throw new Error( 'File is empty.' )

        const extname        = path.extname( file.name )
        const name           = process.env.APP_NAME + '_image_' + uuidv4() + extname
        const originalName   = file.name
        const url            = `${ process.env.SERVER_URL }/uploads/${ name }`
        const uploadPath     = appRootPath.resolve( '/public/uploads' )
        const uploadFilePath = path.resolve( uploadPath, name )

        if( ! fs.existsSync( uploadPath ) ){
            fs.mkdirSync( uploadPath )
        }

        await file.mv( uploadFilePath )

        const media        = new Media()
        media.url          = url
        media.mimetype     = file.mimetype
        media.name         = name
        media.originalName = originalName
        media.source       = source
        media.creator      = creator as User
        await this.repository.save( media )

        return media
    }

    async delete( mediaId: string ): Promise<Media>{
        if( ! mediaId ) throw new Error( 'Media id is empty.' )

        const media = await this.repository.findOneBy( { id: mediaId } )

        if( ! media ) throw new Error( 'Media doesn\'t exists.' )

        const filePath = appRootPath.resolve( `/public/uploads/${ media.name }` )

        fs.unlinkSync( filePath )

        await this.repository.delete( { id: mediaId } )

        return media
    }
}