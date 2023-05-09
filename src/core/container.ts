/* Import All Controller */
import '@modules/index.controller'

import { Container } from 'inversify'
import UserService from "@modules/users/user.service"
import NotificationService from "@modules/notifications/notification.service"
import PostService from "@modules/posts/post.service"
import CommentService from "@modules/comments/comment.service"
import AuthService from "@modules/auth/auth.service"
import ConversationService from "@modules/conversations/conversation.service"
import AccountService from "@modules/account/account.service"
import MediaService from "@services/media.service"
import MessageService from "@modules/messages/message.service"

//create an instance of the inversify container
const container = new Container()

//bind services
container.bind( AuthService ).toSelf().inSingletonScope()
container.bind( UserService ).toSelf().inSingletonScope()
container.bind( NotificationService ).toSelf().inSingletonScope()
container.bind( PostService ).toSelf().inSingletonScope()
container.bind( CommentService ).toSelf().inSingletonScope()
container.bind( AccountService ).toSelf().inSingletonScope()
container.bind( ConversationService ).toSelf().inSingletonScope()
container.bind( MessageService ).toSelf().inSingletonScope()
container.bind( MediaService ).toSelf().inSingletonScope()

export default container