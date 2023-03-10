import {
    Entity,
    Column,
    ManyToOne,
    OneToMany, JoinColumn
} from "typeorm"
import { AbstractEntity } from "./AbstractEntity"
import Post from "./Post"
import User from "./User"
import PostLike from "./PostLike"
import CommentLike from "@entities/CommentLike"
import { Auth } from "@interfaces/index.interfaces"

@Entity( 'comments' )
export default class Comment extends AbstractEntity {
    @Column( { type: 'text', nullable: true } )
    body: string

    @Column( { type: 'int', default: 0 } )
    likesCount: number

    @ManyToOne( () => User, { eager: true } )
    author: User

    @ManyToOne( () => Post, { onDelete: "CASCADE" } )
    @JoinColumn()
    post: Post

    @OneToMany( () => CommentLike, like => like.comment )
    likes: PostLike[]

    //virtual columns
    isViewerLiked: boolean

    async setViewerProperties( auth: Auth ): Promise<Comment>{
        if( auth.isAuthenticated ){
            const like = await CommentLike.findOneBy( { user: { id: auth.user.id }, comment: { id: this.id } } )

            this.isViewerLiked = Boolean( like )
        } else{
            this.isViewerLiked = false
        }

        if( this.author ){
            await this.author.setViewerProperties( auth )
        }

        return this
    }
}