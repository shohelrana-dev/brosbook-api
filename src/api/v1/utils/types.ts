import User from '@entities/User'

export interface Auth {
    user?: User
    isAuthenticated: boolean
}

export interface LoginTokenPayload {
    access_token: string
    expires_in: string | number
    token_type?: string
    user: User
    message?: string
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
