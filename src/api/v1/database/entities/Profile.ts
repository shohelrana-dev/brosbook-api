import { Column, Entity, JoinColumn, OneToOne } from 'typeorm'
import { AbstractEntity } from './AbstractEntity'
import Media from './Media'
import User from './User'

@Entity('profile')
class Profile extends AbstractEntity {
    @Column({ length: 16, nullable: true })
    phone: string

    @OneToOne(() => Media, { eager: true })
    @JoinColumn()
    coverPhoto: Media

    @Column({
        type: 'enum',
        enum: ['male', 'female'],
        nullable: true,
    })
    gender: string

    @Column({ type: 'text', nullable: true })
    bio: string

    @Column({ nullable: true })
    location: string

    @Column({ type: 'date', nullable: true })
    birthdate: string

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User
}

export default Profile
