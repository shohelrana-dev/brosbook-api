import { AfterLoad, Column, Entity, ManyToOne } from 'typeorm'
import { AbstractEntity } from './AbstractEntity'
import Comment from './Comment'
import Post from './Post'
import User from './User'

export enum NotificationTypes {
    LIKED_POST = 'liked_post',
    COMMENTED_POST = 'commented_post',
    LIKED_COMMENT = 'liked_comment',
    FOLLOWED = 'followed',
}

@Entity('notifications')
export class Notification extends AbstractEntity {
    @Column({ type: 'enum', enum: NotificationTypes, nullable: false })
    type: NotificationTypes

    @ManyToOne(() => Post, { onDelete: 'CASCADE' })
    post: Post

    @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
    comment: Comment

    @Column({ type: 'date', nullable: true })
    readAt: string

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    recipient: User

    @ManyToOne(() => User, { eager: true, nullable: false, onDelete: 'CASCADE' })
    initiator: User

    //virtual column
    isRead: boolean

    @AfterLoad()
    setIsRead() {
        this.isRead = !!this.readAt
    }
}
