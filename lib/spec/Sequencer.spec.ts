import { Sequencer, add } from "../Sequencer";
import * as sinon from "sinon";
import { CountdownSegment, CountupSegment } from "../Segments";
var sinonTestFactory = require('sinon-test');
var sinonTest = sinonTestFactory(sinon);
var assert = require('assert');

describe('Sequencer', function () {

  describe('#start()', function () {

    let seq: Sequencer;

    beforeEach(function () {
      
      seq = new Sequencer({ period: 1000 });
    });

    afterEach(function () {
    });

    it('should throw error from no prior subscribe() invocation', sinonTest(function () {
      assert.throws(seq.start, "A call to subscribe() needs to be made prior to start() or pause() invocation.");
    }));

    it('should of called pauser.next(false) once', sinonTest(function () {
      seq.add(CountdownSegment, { duration: 3000 });
      seq.subscribe(() => {
        
      });
      var next = sinon.spy(seq.__marauder().pauser, 'next');

      seq.start();

      next.restore();
      sinon.assert.calledWith(next, false);
    }));
  });

  describe('#pause()', function () {
    let seq: Sequencer;

    beforeEach(function () {
      seq = new Sequencer({ period: 1000 });
    });

    afterEach(function () {
    });

    it('should throw error from no prior subscribe() invocation', sinonTest(function () {
      assert.throws(seq.pause, "A call to subscribe() needs to be made prior to start() or pause() invocation.");
    }));

    it('should of called pauser.next(true) once', sinonTest(function () {
      seq.add(CountdownSegment, { duration: 3000 });
      seq.subscribe(() => {
      });
      var next = sinon.spy(seq.__marauder().pauser, 'next');

      seq.pause();

      next.restore();
      sinon.assert.calledWith(next, true);
    }));
  });

  describe('#group()', function () {

    let seq: Sequencer;

    beforeEach(function () {
      seq = new Sequencer({ period: 1000 });
    });

    afterEach(function () {
    });

    it('collection property should have 1 segments.', sinonTest(function () {
      seq.group(1, add(CountdownSegment, { duration: 3000 }));
      seq.subscribe(() => {
      });
      assert(1, seq.collection.__marauder().segments.length);
    }));

    it('collection property should have 2 segments.', sinonTest(function () {
      seq.group(1, add(CountdownSegment, { duration: 3000 }),add(CountupSegment, { duration: 3000 }));
      seq.subscribe(() => {
      });

      assert(2, seq.collection.__marauder().segments.length);
    }));

    it('collection property should have 2 segments.', sinonTest(function () {
      seq.group(2, add(CountdownSegment, { duration: 3000 }));
      seq.subscribe(() => {
      });

      assert(2, seq.collection.__marauder().segments.length);
    }));

    it('collection property should have 4 segments.', sinonTest(function () {
      seq.group(2, add(CountdownSegment, { duration: 3000 }),add(CountupSegment, { duration: 3000 }));
      seq.subscribe(() => {
      });

      assert(4, seq.collection.__marauder().segments.length);
    }));
  });
});