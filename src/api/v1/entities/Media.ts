import { Entity, Column, ManyToOne, JoinColumn, AfterRemove } from 'typeorm'
import { AbstractEntity } from '@entities/AbstractEntity'
import User from "@entities/User"
import { cloudinary } from "@services/media.service"

export enum MediaSource {
    CONVERSATION = 'conversation',
    POST         = 'post',
    AVATAR       = 'avatar',
    COVER_PHOTO  = 'cover_photo',
    COMMENT      = 'comment'
}

@Entity( 'media' )
export default class Media extends AbstractEntity {
    @Column( { nullable: false } )
    name: string

    @Column( { nullable: false } )
    url: string

    @Column( { nullable: false, length: 12 } )
    format: string

    @Column( { type: "int", nullable: false } )
    width: number

    @Column( { type: "int", nullable: false } )
    height: number

    @Column( { type: 'bigint', nullable: true } )
    size: number

    @Column( { type: 'enum', enum: MediaSource } )
    source: MediaSource

    @ManyToOne( () => User, { onDelete: "CASCADE" } )
    @JoinColumn()
    creator: User

    @AfterRemove()
    async removeFromCloudinary(){
        await cloudinary.uploader.destroy( this.name )
    }
}