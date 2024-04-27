import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
import { User } from './entities/user.entity';
import { Message } from './entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway implements OnModuleInit {
  constructor(private readonly messagesService: MessagesService) {}

  @WebSocketServer()
  server: Server;

  async getSocket(clientId: string): Promise<Socket> {
    var foundSoc;

    const sockets = await this.server.fetchSockets();
    if (sockets) {
      for (let i = 0; i < sockets.length; i++) {
        const soc = sockets[i];
        if (soc.id == clientId) {
          foundSoc = soc;
          break;
        }
      }
    }

    // this.server
    //   .fetchSockets()
    //   .then((sockets) => {
    //     console.log('###### I am here');
    //     for (let i = 0; i < sockets.length; i++) {
    //       const soc = sockets[i];
    //       if (soc.id == clientId) {
    //         foundSoc = soc;
    //         break;
    //       }
    //     }
    //   })
    //   .catch((error) => {});

    return foundSoc;
  }

  onModuleInit() {
    this.server.on('connection', (client: Socket) => {
      console.log(`Socket client connected with id: (${client.id})`);

      // log and emit disconnect event
      client.on('disconnect', () => {
        console.log(`Socket: (${client.id}) disconnected.`);
        var removed = this.messagesService.removeClient(client.id);
        if (removed) {
          client.broadcast.emit('clientRemoved', { clientId: client.id });
        }
      });
    });

    // this.server.on('disconnect', (client: Socket) => {
    //   console.log(`Socket: (${client.id}) disconnected.`);
    // });
  }

  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // new mod
    // before adding the message to messages list
    // make sure the user is logged-in
    // in this case (is in onlineUsers list)
    if (!this.messagesService.isUserOnline(client.id)) {
      const returnObj = {
        status: 404,
        msg: `Cant send message.\nYou are not logged-in yet`,
      };
      return returnObj;
    }

    const msg = await this.messagesService.create(createMessageDto);

    // emit created message to rest of clients
    this.server.emit('message', msg);

    return msg;
  }

  @SubscribeMessage('findAllMessages')
  findAll() {
    return this.messagesService.findAll();
  }

  @SubscribeMessage('join')
  joinRoom(
    @MessageBody('name') name: string,
    @ConnectedSocket() client: Socket,
  ) {
    // new mod
    // check if a user exists with the same name
    type join_returnObj = {
      status: number;
      msg: string;
      data?: {
        users: User[];
        messages: Message[];
      };
    };

    const userNameFound = this.messagesService.onlineUsers.find(
      (u) => u.userName.toLowerCase() == name.toLowerCase(),
    );
    if (userNameFound) {
      // client.emit('userNameExists', {});
      const returnObj: join_returnObj = {
        status: 404,
        msg: `User (${name}) already exist.\nplease enter another one.`,
      };
      return returnObj;
      return;
    }

    // send (joined) event to other online users
    setTimeout(() => {
      const payload: User = {
        userName: name,
        clientId: client.id,
      };

      this.messagesService.onlineUsers.forEach(async (u) => {
        if (u.clientId != client.id) {
          const soc = await this.getSocket(u.clientId);
          if (soc) {
            console.log(`soc (${u.clientId}) found`);
            soc.emit('joined', payload);
          } else {
            console.log('soc not found');
          }
        }
      });
    }, 500);

    const returnObj: join_returnObj = {
      status: 200,
      msg: 'user joined successfully',
      data: {
        users: this.messagesService.join(name, client.id),
        messages: this.messagesService.findAll(),
      },
    };
    console.log(`returnObj: ${JSON.stringify(returnObj)}`);
    return returnObj;
  }

  @SubscribeMessage('typing')
  async typing(
    @MessageBody('isTyping') isTyping: boolean,
    @ConnectedSocket() client: Socket,
  ) {
    const clientName = await this.messagesService.getClientName(client.id);

    // client.broadcast.emit('typing', {
    //   clientName,
    //   isTyping,
    // });
 
    // new mod
    // emit typing event only to connected/online client
    this.messagesService.onlineUsers.forEach(async (u) => {
      if (u.clientId != client.id) {
        const soc = await this.getSocket(u.clientId);
        if (soc) {
          soc.emit('typing', {
            clientName,
            isTyping,
          });
        }
      }
    });

    return this.messagesService.typing();
  }
}
