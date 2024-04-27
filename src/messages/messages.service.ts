import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';
import { User } from './entities/user.entity';

@Injectable()
export class MessagesService {
  messages: Message[] = [
    {
      dateTime: new Date(),
      clientId: 'system-reserved-id',
      userName: 'System',
      content: 'feel free to send any message.',
    },
    {
      dateTime: new Date(),
      clientId: 'system-reserved-id',
      userName: 'System',
      content: 'This is a message from server. Hello everyone',
    },
  ];
  onlineUsers: User[] = [];

  create(createMessageDto: CreateMessageDto) {
    // const msg = { ...createMessageDto };
    const msg: Message = {
      ...createMessageDto,
      dateTime: new Date(),
      userName: this.getClientName(createMessageDto.clientId),
    };
    // this.messages.push(msg);
    this.messages.unshift(msg); // <-- this will add new msg object to the begining of the array
    // console.log(`msg: ${JSON.stringify(msg)}`);
    // console.log(`messages: ${JSON.stringify(this.messages)}`);
    return msg;
  }

  findAll() {
    return this.messages;
  }

  join(name: string, clientId: string) {
    // this.onlineUsers[clientId] = name;
    // return Object.values(this.clientToUser);

    // push new user to onlineUsers array
    this.onlineUsers.push({
      clientId,
      userName: name,
    });
    // console.log(
    //   `online users: ${JSON.stringify(this.onlineUsers)}`,
    // );

    return this.onlineUsers;
  }

  removeClient(clientId: string) {
    var result = false;
    if (this.onlineUsers.find((user) => user.clientId == clientId)) {
      this.onlineUsers = this.onlineUsers.filter(
        (user) => user.clientId !== clientId,
      );
      result = true;
    } else {
      result = false;
    }
    return result;
  }

  typing() {
    // TODO..
  }

  getClientName(clientId: string) {
    var user = this.onlineUsers.find((u) => u.clientId == clientId);
    if (user) {
      return user.userName;
    } else {
      return 'not-found';
    }
  }

  // onlineClients() {
  //   return this.onlineUsers;
  // }

  isUserOnline(clientId: string) {
    const foundUser = this.onlineUsers.find((u) => u.clientId == clientId);
    if(foundUser) return true;
    return false;
  }
}
