import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import { AbstractEntity } from './AbstractEntity'
import Conversation from './Conversation'
import Media from './Media'
import Reaction from './Reaction'
import User from './User'

export enum MessageType {
    IMAGE = 'image',
    FILE = 'file',
    TEXT = 'text',
    EMOJI = 'emoji',
}

@Entity('messages')
export default class Message extends AbstractEntity {
    @Column({ type: 'text', nullable: true })
    body: string

    @OneToOne(() => Media, { eager: true })
    @JoinColumn()
    image: Media

    @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
    type: string

    @Column({ type: 'date', nullable: true })
    seenAt: Date

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
        eager: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    conversation: Conversation

    @ManyToOne(() => User, { eager: true })
    @JoinColumn()
    sender: User

    @OneToMany(() => Reaction, (reaction) => reaction.message, { eager: true })
    reactions: Reaction[]

    //virtual columns
    isMeSender: boolean
    recipient: User
}
