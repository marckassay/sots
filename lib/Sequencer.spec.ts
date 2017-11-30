import { Sequencer } from "./index";

var assert = require('assert');
describe('Sequencer', function() {
  describe('#start()', function() {
    it('should throw error from no prior subscribe() invocation', function() {
        let seq:Sequencer = new Sequencer({period: 1000});
        assert.throws(seq.start, "A call to subscribe() needs to be made prior to start() or pause() invocation.");
    });
  });
  describe('#pause()', function() {
    it('should throw error from no prior subscribe() invocation', function() {
        let seq:Sequencer = new Sequencer({period: 1000});
        assert.throws(seq.start, "A call to subscribe() needs to be made prior to start() or pause() invocation.");
    });
  });
});