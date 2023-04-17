/* All Controller Import */
import './api/v1/modules/index.controller'

import { Container } from 'inversify'
import UserService from "@modules/users/user.service"
import MediaService from "@services/media.service"
import NotificationService from "@modules/notifications/notification.service"
import PostService from "@modules/posts/post.service"
import CommentService from "@modules/comments/comment.service"
import AuthService from "@modules/auth/auth.service"
import { EmailService } from "@services/email.service"
import ConversationService from "@modules/conversations/conversation.service"
import AccountService from "@modules/account/account.service"

//create an instance of the inversify container
const container = new Container()

//bind services
container.bind( AuthService ).toSelf()
container.bind( UserService ).toSelf()
container.bind( MediaService ).toSelf()
container.bind( EmailService ).toSelf()
container.bind( NotificationService ).toSelf()
container.bind( PostService ).toSelf()
container.bind( CommentService ).toSelf()
container.bind( AccountService ).toSelf()
container.bind( ConversationService ).toSelf()

export default container