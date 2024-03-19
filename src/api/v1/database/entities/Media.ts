import { cloudinary } from '@services/media.service'
import { AfterRemove, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { AbstractEntity } from './AbstractEntity'
import User from './User'

export enum MediaSource {
    CONVERSATION = 'conversation',
    POST = 'post',
    AVATAR = 'avatar',
    COVER_PHOTO = 'cover_photo',
    COMMENT = 'comment',
}

@Entity('media')
export default class Media extends AbstractEntity {
    @Column({ nullable: false })
    name: string

    @Column({ nullable: false })
    url: string

    @Column({ nullable: false, length: 12 })
    format: string

    @Column({ type: 'int', nullable: false })
    width: number

    @Column({ type: 'int', nullable: false })
    height: number

    @Column({ type: 'bigint', nullable: true })
    size: number

    @Column({ type: 'enum', enum: MediaSource })
    source: MediaSource

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    creator: User

    @AfterRemove()
    deleteMediaFormCloudinary() {
        cloudinary.uploader.destroy(this.name)
    }
}
