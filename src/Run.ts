import EventEmitter from './EventEmitter';
import TestRunner from './TestRunner';

EventEmitter.initialize();
TestRunner.start(EventEmitter);