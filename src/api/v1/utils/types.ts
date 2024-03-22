export interface Auth {
    user?: { id: string; email: string; username: string }
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
