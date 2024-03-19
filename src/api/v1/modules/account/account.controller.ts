import User from '@entities/User'
import authMiddleware from '@middleware/auth.middleware'
import dtoValidationMiddleware from '@middleware/dto-validation.middleware'
import { ChangePasswordDTO, ChangeUsernameDTO, UpdateProfileDTO } from '@modules/account/account.dto'
import { Request } from 'express'
import { inject } from 'inversify'
import { controller, httpPatch } from 'inversify-express-utils'
import AccountService from './account.service'

/**
 * @class AccountController
 * @desc Responsible for handling API requests for the
 * /account route.
 **/
@controller('/account', authMiddleware)
export default class AccountController {
    constructor(
        @inject(AccountService)
        private readonly accountService: AccountService
    ) {}

    @httpPatch('/profile', dtoValidationMiddleware(UpdateProfileDTO))
    public async updateProfile(req: Request): Promise<User> {
        return await this.accountService.updateProfile(req.body, req.auth)
    }

    @httpPatch('/username', dtoValidationMiddleware(ChangeUsernameDTO))
    public async changeUsername(req: Request): Promise<User> {
        return await this.accountService.changeUsername(req.body, req.auth)
    }

    @httpPatch('/password', dtoValidationMiddleware(ChangePasswordDTO))
    public async changePassword(req: Request): Promise<{ message: string }> {
        await this.accountService.changePassword(req.body, req.auth)

        return { message: 'success' }
    }
}
