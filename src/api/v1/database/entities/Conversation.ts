import { Entity, OneToMany, ManyToOne, OneToOne, JoinColumn } from "typeorm"
import { AbstractEntity } from "./AbstractEntity"
import User from "./User"
import Message from "./Message"

@Entity( 'conversations' )
export default class Conversation extends AbstractEntity {
    @ManyToOne( () => User, { onDelete: "CASCADE" } )
    user1: User

    @ManyToOne( () => User, { onDelete: "CASCADE" } )
    user2: User

    @OneToMany( () => Message, message => message.conversation )
    messages: Message[]

    @OneToOne( () => Message )
    @JoinColumn()
    lastMessage: Message

    //virtual column
    participant: User
    unreadMessagesCount: number
}