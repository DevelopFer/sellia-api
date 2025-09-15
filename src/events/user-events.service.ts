import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class UserEventsService extends EventEmitter {
  emitUserJoined(user: any) {
    this.emit('user:joined', user);
  }
}