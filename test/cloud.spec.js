'use strict';

var should = require('should'),
    sinon = require('sinon'),
    Parse = require('../lib/cloud.js').Parse;

describe('Parse Cloud Code', function () {
    beforeEach(function (done) {
        Parse.Cloud.Simulator.reset();
        Parse.Cloud.TestStore.reset();
        done();
    });

    describe('define', function () {

        it('stores functions', function () {
            var fn = function () {
                },
                fnName = 'myFn';
            Parse.Cloud.define(fnName, fn);
            Parse.Cloud.Simulator._functions[fnName].should.equal(fn);
        });

    });

    describe('Simulator', function () {

        describe('runFunction', function () {

            it('executes the cloud function', function () {
                var fn = sinon.spy(),
                    fnName = 'myFn';
                Parse.Cloud.define(fnName, fn);
                Parse.Cloud.Simulator.runFunction(fnName);
                fn.called.should.be.true;
            });

            it('supplies request params to the cloud function', function () {
                var fn = sinon.spy(),
                    fnName = 'myFn',
                    params = {foo: 'bar'};
                Parse.Cloud.define(fnName, fn);
                Parse.Cloud.Simulator.runFunction(fnName, params);
                fn.args[0][0].params.should.equal(params);
            });

            it('supplies request user to the cloud function', function () {
                var fn = sinon.spy(),
                    fnName = 'myFn',
                    params = {foo: 'bar'},
                    user = new Parse.User();
                Parse.Cloud.define(fnName, fn);
                Parse.Cloud.Simulator.runFunction(fnName, params, user);
                fn.args[0][0].user.should.equal(user);
            });

            it('returns response object with success and error spies', function () {
                var fn = function () {
                    },
                    fnName = 'myFn';
                Parse.Cloud.define(fnName, fn);
                var response = Parse.Cloud.Simulator.runFunction(fnName);

                (response.hasOwnProperty('success')).should.be.true;
                (typeof response.success.calledWith).should.equal('function');
                response.success.callCount.should.equal(0);
                response.success.toString().should.equal('spy');

                (response.hasOwnProperty('error')).should.be.true;
                (typeof response.error.calledWith).should.equal('function');
                response.error.callCount.should.equal(0);
                response.error.toString().should.equal('spy');
            });

            it('surfaces calls to success in the cloud function', function () {
                var returnValue = {success: true},
                    fn = function (request, response) {
                        response.success(returnValue)
                    },
                    fnName = 'myFn';

                Parse.Cloud.define(fnName, fn);
                var response = Parse.Cloud.Simulator.runFunction(fnName);

                response.success.calledOnce.should.be.true;
                response.success.args[0][0].should.equal(returnValue);

                response.error.called.should.not.be.true;
            });

            it('surfaces calls to error in the cloud function', function () {
                var returnValue = 'error message',
                    fn = function (request, response) {
                        response.error(returnValue)
                    },
                    fnName = 'myFn';

                Parse.Cloud.define(fnName, fn);
                var response = Parse.Cloud.Simulator.runFunction(fnName);

                response.success.called.should.not.be.true;

                response.error.calledOnce.should.be.true;
                response.error.args[0][0].should.equal(returnValue);
            });

        });

    });

    describe('Parse.Object', function () {

        describe ('save', function () {

            it('is successful', function () {
                 var Task = Parse.Object.extend('Task');
                 var task = new Task();

                 var success = sinon.spy();
                 var error = sinon.spy();
                
                 task.save().then(success, error);

                 success.called.should.be.true;
                 success.args[0][0].should.equal(task)

                 error.called.should.not.be.true;

            });

            it('sets unique id if new', function () {
                 var Task = Parse.Object.extend('Task');
                 var task0 = new Task();
                 var task1 = new Task();

                 should.not.exist(task0.id);
                 should.not.exist(task1.id);

                 task0.save()
                 task0.id.should.exist;

                 task1.save();
                 task1.id.should.exist;

                 task0.id.should.not.equal(task1.id);
            });

            it('sets attributes in given hash', function () {
                 var Task = Parse.Object.extend('Task');
                 var task = new Task();

                 task.save({'attr0' : 'val', 'attr1' : true, 'attr2' : 3});

                 should.exist(task.get('attr0'));
                 should.exist(task.get('attr1'));
                 should.exist(task.get('attr2'));

                 task.get('attr0').should.equal('val');
                 task.get('attr1').should.equal(true);                 
                 task.get('attr2').should.equal(3);
                 
                
            });
        });

    });

    describe('Parse.Query', function () {

        describe ('get', function () {

            it('is successful', function () {

                var Task = Parse.Object.extend('Task');
                var task = new Task();
                task.save();

                var query = new Parse.Query("Task");
                var success = sinon.spy();
                var error = sinon.spy();
                
                query.get(task.id, {
                    success: success,
                    error: error
                });

                success.called.should.be.true;
                success.args[0][0].should.equal(task);

                error.called.should.not.be.true;

            });

            it('does not return objects for invalid ids', function () {

                
                var success = sinon.spy();
                var error = sinon.spy();
                
                var query = new Parse.Query("Task");
                query.get('not-a-valid-id', {
                    success: success,
                    error: error
                });

                var success2 = sinon.spy();
                var error2 = sinon.spy();

                query.get(undefined, {
                    success: success2,
                    error: error2
                });

                success.called.should.not.be.true;
                error.called.should.be.true;

                success2.called.should.not.be.true;
                error2.called.should.be.true;

            });

        });

    });
});