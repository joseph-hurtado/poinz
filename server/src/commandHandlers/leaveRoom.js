/**
 * A user want's to leave the room.
 * Is also produced by the socketServer itself on connection lost!
 *
 */
module.exports = {
  existingRoom: true,
  preCondition: (room, command, userId) => {
    if (command.payload.userId !== userId) {
      throw new Error('Can only leave if userId in command payload matches!');
    }
  },
  fn: (room, command) => {
    if (command.payload.connectionLost) {
      room.applyEvent('connectionLost', {userId: command.payload.userId});
    } else {
      room.applyEvent('leftRoom', {userId: command.payload.userId});
    }
  }
};
