const
  assert = require('assert'),
  Immutable = require('immutable'),
  uuid = require('node-uuid').v4,
  testUtils = require('../testUtils'),
  processorFactory = require('../../../src/commandProcessor'),
  handlerGatherer = require('../../../src/handlerGatherer');

describe('selectStory', () => {


  beforeEach(function () {
    const cmdHandlers = handlerGatherer.gatherCommandHandlers();
    const evtHandlers = handlerGatherer.gatherEventHandlers();

    this.userId = uuid();
    this.commandId = uuid();
    this.roomId = 'rm_' + uuid();

    this.mockRoomsStore = testUtils.newMockRoomsStore(new Immutable.Map({
      id: this.roomId
    }));

    this.processor = processorFactory(cmdHandlers, evtHandlers, this.mockRoomsStore);

    // prepare the state with a story
    return this.processor({
        id: this.commandId,
        roomId: this.roomId,
        name: 'addStory',
        payload: {
          title: 'SuperStory 444',
          description: 'This will be awesome'
        }
      }, this.userId)
      .then(producedEvents => this.storyId = producedEvents[0].payload.id);
  });

  it('Should produce storySelected event', function () {
    return this.processor({
        id: this.commandId,
        roomId: this.roomId,
        name: 'selectStory',
        payload: {
          storyId: this.storyId
        }
      }, this.userId)
      .then(producedEvents => {
        assert(producedEvents);
        assert.equal(producedEvents.length, 1);

        const storySelectedEvent = producedEvents[0];
        testUtils.assertValidEvent(storySelectedEvent, this.commandId, this.roomId, this.userId, 'storySelected');
        assert.equal(storySelectedEvent.payload.storyId, this.storyId);
      });
  });

  it('Should store id of selectedStory', function () {
    return this.processor({
        id: this.commandId,
        roomId: this.roomId,
        name: 'selectStory',
        payload: {
          storyId: this.storyId
        }
      }, this.userId)
      .then(() => this.mockRoomsStore.getRoomById())
      .then(room => assert.equal(room.get('selectedStory'), this.storyId));
  });

  describe('preconditions', () => {

    it('Should throw if story is not in room', function () {
      return testUtils.assertPromiseRejects(
        this.processor({
          id: this.commandId,
          roomId: this.roomId,
          name: 'selectStory',
          payload: {
            storyId: 'story-not-in-room'
          }
        }, this.userId),
        'Precondition Error during "selectStory": Story story-not-in-room cannot be selected. It is not part of room');
    });
  });

});
