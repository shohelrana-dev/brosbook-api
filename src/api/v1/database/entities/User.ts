import argon2 from 'argon2'
import {
    AfterLoad,
    BeforeInsert,
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    OneToMany,
    OneToOne,
} from 'typeorm'
import { AbstractEntity } from './AbstractEntity'
import Media from './Media'
import Post from './Post'
import Profile from './Profile'

@Entity('users')
export default class User extends AbstractEntity {
    @Column({ length: 20, nullable: false })
    firstName: string

    @Column({ length: 20, nullable: false })
    lastName: string

    @Column({ unique: true, length: 25, nullable: false })
    username: string

    @Column({ unique: true, length: 50, nullable: false })
    email: string

    @Column({ length: 100, nullable: false, select: false })
    password: string

    @OneToOne(() => Media, { eager: true })
    @JoinColumn()
    avatar: Media

    @Column({ type: 'boolean', default: false })
    active: boolean

    @Column({ type: 'date', nullable: true })
    emailVerifiedAt: Date

    @OneToOne(() => Profile, (profile) => profile.user)
    profile?: Profile

    @OneToMany(() => Post, (post) => post.author)
    posts?: Post[]

    @ManyToMany(() => User, (user) => user.followings)
    @JoinTable({
        name: 'follows',
        joinColumn: { name: 'userId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'followerId', referencedColumnName: 'id' },
    })
    followers: User[]

    @ManyToMany(() => User, (user) => user.followers)
    followings: User[]

    //virtual columns
    fullName: string
    isViewerFollow: boolean
    hasEmailVerified: boolean

    @BeforeInsert()
    async makePasswordHash() {
        this.password = await argon2.hash(this.password)
    }

    @BeforeInsert()
    generateUsernameFromEmail() {
        if (!this.username) {
            const nameParts = this.email.split('@')
            this.username = nameParts[0].toLowerCase()
        }
    }

    @AfterLoad()
    setFullName() {
        this.fullName = `${this.firstName} ${this.lastName}`
    }

    @AfterLoad()
    setEmailVerified() {
        this.hasEmailVerified = this.emailVerifiedAt !== null && !!this.emailVerifiedAt
    }

    @AfterLoad()
    setDefaultAvatar() {
        if (!this.avatar) {
            this.avatar = { url: `${process.env.SERVER_URL}/avatar.png` } as Media
        }
    }
}
