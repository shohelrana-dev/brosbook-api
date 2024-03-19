import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import { AbstractEntity } from './AbstractEntity'
import Comment from './Comment'
import Media from './Media'
import PostLike from './PostLike'
import User from './User'

@Entity('posts')
export default class Post extends AbstractEntity {
    @Column({ type: 'text', nullable: true })
    body: string

    @Column({ type: 'int', default: 0 })
    commentsCount: number

    @Column({ type: 'int', default: 0 })
    likesCount: number

    @OneToOne(() => Media, { eager: true, nullable: true })
    @JoinColumn()
    image: Media

    @ManyToOne(() => User, { eager: true, nullable: false, onDelete: 'CASCADE' })
    author: User

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[]

    @OneToMany(() => PostLike, (like) => like.post)
    likes: PostLike[]

    //virtual columns
    isViewerLiked: boolean
}
