import User from "@entities/User"

export interface Auth {
    user?: {
        id: string,
        username: string,
        email: string
    }
    isAuthenticated: boolean
}

export interface LoginTokenPayload {
    access_token: string
    expires_in: string | number
    token_type?: string
    user: User,
    message?: string
}

export interface PaginateMeta {
    count: number,
    currentPage: number,
    nextPage: number,
    prevPage: number,
    lastPage: number,
}

export interface ListResponse<T> extends PaginateMeta {
    items: T[]
}

export interface ListQueryParams {
    page?: number
    limit?: number
}

export interface SearchQueryParams {
    key: string
    page?: number
    limit?: number
}

export interface PostsQueryParams {
    userId?: string
    page?: number
    limit?: number
}