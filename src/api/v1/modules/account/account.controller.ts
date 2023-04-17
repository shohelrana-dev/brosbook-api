import { Request } from "express"
import AccountService from "./account.service"
import { controller, httpPatch } from "inversify-express-utils"
import authMiddleware from "@middleware/auth.middleware"
import { inject } from "inversify"
import User from "@entities/User"

/**
 * @class AccountController
 * @desc Responsible for handling API requests for the
 * /account route.
 **/
@controller( '/account', authMiddleware )
export default class AccountController {
    constructor(
        @inject( AccountService )
        private readonly accountService: AccountService
    ){}

    @httpPatch( '/profile' )
    public async updateProfile( req: Request ): Promise<User>{
        return await this.accountService.updateProfile( req.body, req.auth )
    }

    @httpPatch( '/username' )
    public async changeUsername( req: Request ): Promise<User>{
        return await this.accountService.changeUsername( req.body, req.auth )
    }

    @httpPatch( '/password' )
    public async changePassword( req: Request ): Promise<{ message: string }>{
        await this.accountService.changePassword( req.body, req.auth )

        return { message: "success" }
    }
}