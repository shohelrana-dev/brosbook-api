import NotificationService from "@modules/notifications/notification.service"
import { NextFunction, Request, Response } from "express"

export default class NotificationController {
    constructor( private readonly notificationService: NotificationService ){}

    getMany = async( req: Request, res: Response, next: NextFunction ) => {
        try {
            const notifications = await this.notificationService.getMany( req.query, req.auth )

            res.json( notifications )
        } catch ( err ) {
            next( err )
        }
    }

    getUnreadCount = async( req: Request, res: Response, next: NextFunction ) => {
        try {
            const count = await this.notificationService.getUnreadCount( req.auth )

            res.json( { count } )
        } catch ( err ) {
            next( err )
        }
    }

    readAll = async( req: Request, res: Response, next: NextFunction ) => {
        try {
            await this.notificationService.readAll( req.auth )

            res.json()
        } catch ( err ) {
            next( err )
        }
    }
}