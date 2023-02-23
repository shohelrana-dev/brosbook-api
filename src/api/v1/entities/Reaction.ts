import { AbstractEntity } from "./AbstractEntity"
import { Entity, Column, ManyToOne, JoinColumn, AfterLoad } from "typeorm"
import Message from "./Message"
import User from "./User"

@Entity( 'reactions' )
class Reaction extends AbstractEntity {
    @Column( { length: 10, nullable: false } )
    name: string

    @ManyToOne( () => User, { eager: true } )
    @JoinColumn()
    sender: User

    @ManyToOne( () => Message, message => message.reactions )
    @JoinColumn()
    message: Message

    //virtual column
    url: string

    @AfterLoad()
    makeUrl(){
        this.url = `${ process.env.SERVER_URL }/reactions/${ name }.png`
    }
}

export default Reaction