import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { AbstractEntity } from './AbstractEntity'
import CommentLike from './CommentLike'
import Post from './Post'
import User from './User'

@Entity('comments')
export default class Comment extends AbstractEntity {
    @Column({ type: 'text', nullable: true })
    body: string

    @Column({ type: 'int', default: 0 })
    likesCount: number

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    author: User

    @ManyToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn()
    post: Post

    @OneToMany(() => CommentLike, (like) => like.comment)
    likes: CommentLike[]

    //virtual columns
    isViewerLiked: boolean
}
