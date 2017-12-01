import { Sequencer, add } from "./Sequencer";
import * as sinon from "sinon";
import { CountdownSegment, CountupSegment } from "./Segments";

var assert = require('assert');
describe('Sequencer', function () {

  describe('#start()', function () {

    let seq: Sequencer;

    beforeEach(function () {
      seq = new Sequencer({ period: 1000 });
    });

    afterEach(function () {
      seq = new Sequencer({ period: 1000 });
    });

    it('should throw error from no prior subscribe() invocation', function (this) {
      assert.throws(seq.start, "A call to subscribe() needs to be made prior to start() or pause() invocation.");
    });

    it('should of called pauser.next(false) once', function (this) {
      seq.add(CountdownSegment, { duration: 3000 });
      seq.subscribe(() => {
      });
      let marauder = seq.marauder();
      var next = sinon.spy(marauder.pauser, 'next');

      seq.start();

      next.restore();
      sinon.assert.calledWith(next, false);
    });
  });

  describe('#pause()', function () {

    let seq: Sequencer;

    beforeEach(function () {
      seq = new Sequencer({ period: 1000 });
    });

    afterEach(function () {
      seq = new Sequencer({ period: 1000 });
    });

    it('should throw error from no prior subscribe() invocation', function (this) {
      assert.throws(seq.pause, "A call to subscribe() needs to be made prior to start() or pause() invocation.");
    });

    it('should of called pauser.next(true) once', function (this) {
      seq.add(CountdownSegment, { duration: 3000 });
      seq.subscribe(() => {
      });
      let marauder = seq.marauder();
      var next = sinon.spy(marauder.pauser, 'next');

      seq.pause();

      next.restore();
      sinon.assert.calledWith(next, true);
    });
  });

  describe('#group()', function () {

    let seq: Sequencer;

    beforeEach(function () {
      seq = new Sequencer({ period: 1000 });
    });

    afterEach(function () {
      seq = new Sequencer({ period: 1000 });
    });

    it('collection property should have 1 segments.', function (this) {
      seq.group(1, add(CountdownSegment, { duration: 3000 }));
      seq.subscribe(() => {
      });

      assert(1, seq.collection.marauder().segments.length);
    });

    it('collection property should have 2 segments.', function (this) {
      seq.group(1, add(CountdownSegment, { duration: 3000 }),add(CountupSegment, { duration: 3000 }));
      seq.subscribe(() => {
      });

      assert(2, seq.collection.marauder().segments.length);
    });

    it('collection property should have 2 segments.', function (this) {
      seq.group(2, add(CountdownSegment, { duration: 3000 }));
      seq.subscribe(() => {
      });

      assert(2, seq.collection.marauder().segments.length);
    });

    it('collection property should have 4 segments.', function (this) {
      seq.group(2, add(CountdownSegment, { duration: 3000 }),add(CountupSegment, { duration: 3000 }));
      seq.subscribe(() => {
      });

      assert(4, seq.collection.marauder().segments.length);
    });
  });
});