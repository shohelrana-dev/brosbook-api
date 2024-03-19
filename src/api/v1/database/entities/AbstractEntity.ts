import {
    BaseEntity, BeforeInsert,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    UpdateDateColumn
} from "typeorm"
import { nanoid } from 'nanoid'

export class AbstractEntity extends BaseEntity {
    @Column( {
        type: 'varchar',
        length: 30,
        unique: true,
        primary: true
    } )
    id: string

    @CreateDateColumn()
    readonly createdAt: Date

    @UpdateDateColumn()
    readonly updatedAt: Date

    @DeleteDateColumn( { select: false } )
    readonly deletedAt: Date

    @BeforeInsert()
    generateId() {
        this.id = nanoid()
    }
}