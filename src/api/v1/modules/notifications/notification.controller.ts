import NotificationService from "@modules/notifications/notification.service"
import { Request } from "express"
import {controller, httpGet, httpPatch} from "inversify-express-utils"
import authMiddleware from "@middleware/auth.middleware"
import { ListResponse } from "@interfaces/index.interfaces"
import { Notification } from "@entities/Notification"

/**
 * @class NotificationController
 * @desc Responsible for handling API requests for the
 * /notifications route.
 **/
@controller( '/notifications', authMiddleware )
export default class NotificationController {
    constructor( private readonly notificationService: NotificationService ){}

    @httpGet( '/' )
    public async getNotifications( req: Request ): Promise<ListResponse<Notification>>{
        const page  = Number( req.query.page || 1 )
        const limit = Number( req.query.limit || 12 )

        return await this.notificationService.getNotifications( { page, limit }, req.auth )
    }

    @httpGet( '/unread_count' )
    public async getUnreadNotificationsCount( req: Request ): Promise<{ count: number }>{
        const count = await this.notificationService.getUnreadNotificationsCount( req.auth )

        return { count }
    }

    @httpPatch( '/read_all' )
    public async readAllNotifications( req: Request ): Promise<{ message: string }>{
        await this.notificationService.readAllNotifications( req.auth )

        return { message: 'success' }
    }
}