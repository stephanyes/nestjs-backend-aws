import { customMessageType } from '../../constants/logger.constants';

export default class CustomMessageDto {
  custom_message: customMessageType;

  constructor(message: customMessageType) {
    if (message instanceof Error) {
      this.custom_message = {
        ...message,
        message: message.message,
        stack: message.stack,
        name: message.name,
      };
      return;
    }
    this.custom_message = message;
  }
}
