import Comment from '@database/entities/Comment'
import { MessageType } from '@database/entities/Message'
import { NotificationTypes } from '@database/entities/Notification'
import Post from '@database/entities/Post'
import User from '@database/entities/User'
import { UploadedFile } from 'express-fileupload'

export interface Auth {
    user?: { id: string; email: string; username: string; avatar: { url: string } }
    isAuthenticated: boolean
    isTokenExpired: boolean
}

export interface AuthToken {
    accessToken: string
    expiresIn: string | number
    tokenType: string
}

export interface PaginateMeta {
    count: number
    currentPage: number
    nextPage: number
    prevPage: number
    lastPage: number
}

export interface ListResponse<T> extends PaginateMeta {
    items: T[]
}

export interface ListQueryParams {
    page?: number
    limit?: number
}

export interface SearchQueryParams extends ListQueryParams {
    q: string
}

export interface PostsQueryParams extends ListQueryParams {
    authorId?: string
}

export interface MessagePayload {
    image: UploadedFile
    body: string
    type: MessageType
}

export interface ReactionPayload {
    conversationId: string
    messageId: string
    name: string
}

export interface NotificationPayload {
    recipient: User
    post?: Post
    comment?: Comment
    type: NotificationTypes
}
