const
  assert = require('assert'),
  Immutable = require('immutable'),
  uuid = require('node-uuid').v4,
  testUtils = require('../testUtils'),
  processorFactory = require('../../../src/commandProcessor'),
  handlerGatherer = require('../../../src/handlerGatherer');

describe('reveal', () => {

  beforeEach(function () {
    const cmdHandlers = handlerGatherer.gatherCommandHandlers();
    const evtHandlers = handlerGatherer.gatherEventHandlers();

    this.userId = uuid();
    this.commandId = uuid();
    this.roomId = 'rm_' + uuid();

    this.mockRoomsStore = testUtils.newMockRoomsStore(Immutable.fromJS({
      id: this.roomId,
      users: {
        [this.userId]: {
          id: this.userId
        }
      }
    }));

    this.processor = processorFactory(cmdHandlers, evtHandlers, this.mockRoomsStore);

    // add story to room
    return this.processor({
        id: this.commandId,
        roomId: this.roomId,
        name: 'addStory',
        payload: {
          title: 'SuperStory 444',
          description: 'This will be awesome'
        }
      }, this.userId)
      .then(producedEvents => {

        this.storyId = producedEvents[0].payload.id;

        // select the story
        return this.processor({
          id: this.commandId,
          roomId: this.roomId,
          name: 'selectStory',
          payload: {
            storyId: this.storyId
          }
        }, this.userId);
      });

  });

  it('Should produce revealed event', function () {
    return this.processor({
        id: this.commandId,
        roomId: this.roomId,
        name: 'reveal',
        payload: {
          storyId: this.storyId
        }
      }, this.userId)
      .then(producedEvents => {
        assert(producedEvents);
        assert.equal(producedEvents.length, 1);

        const revealedEvent = producedEvents[0];
        testUtils.assertValidEvent(revealedEvent, this.commandId, this.roomId, this.userId, 'revealed');
        assert.equal(revealedEvent.payload.storyId, this.storyId);
        assert.equal(revealedEvent.payload.manually, true);
      });
  });

  it('Should set "revealed" flag', function () {
    return this.processor({
        id: this.commandId,
        roomId: this.roomId,
        name: 'reveal',
        payload: {
          storyId: this.storyId
        }
      }, this.userId)
      .then(() => this.mockRoomsStore.getRoomById())
      .then(room => assert.equal(room.getIn(['stories', this.storyId, 'revealed']), true));
  });

  describe('preconditions', () => {

    it('Should throw if storyId does not match currently selected story', function () {
      return testUtils.assertPromiseRejects(
        this.processor({
          id: this.commandId,
          roomId: this.roomId,
          name: 'reveal',
          payload: {
            storyId: 'anotherStory'
          }
        }, this.userId),
        'Can only reveal currently selected story!');
    });

    it('Should throw if user is visitor', function () {

      this.mockRoomsStore.manipulate(room => room.setIn(['users', this.userId, 'visitor'], true));

      return testUtils.assertPromiseRejects(
        this.processor({
          id: this.commandId,
          roomId: this.roomId,
          name: 'reveal',
          payload: {
            storyId: this.storyId
          }
        }, this.userId),
        'Visitors cannot reveal stories!');
    });


  });

});
