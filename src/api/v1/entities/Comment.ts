import {
    Entity,
    Column,
    ManyToOne,
    OneToMany, JoinColumn
} from "typeorm"
import { AbstractEntity } from "./AbstractEntity"
import Post from "./Post"
import User from "./User"
import CommentLike from "@entities/CommentLike"

@Entity( 'comments' )
export default class Comment extends AbstractEntity {
    @Column( { type: 'text', nullable: true } )
    body: string

    @Column( { type: 'int', default: 0 } )
    likesCount: number

    @ManyToOne( () => User, { eager: true, onDelete: "CASCADE" } )
    author: User

    @ManyToOne( () => Post, { onDelete: "CASCADE" } )
    @JoinColumn()
    post: Post

    @OneToMany( () => CommentLike, like => like.comment )
    likes: CommentLike[]

    //virtual columns
    isViewerLiked: boolean
}