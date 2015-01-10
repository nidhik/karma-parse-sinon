'use strict';

var Parse = require('parse').Parse,
    sinon = require('sinon'),
    _ = require('underscore'),
    uuid = require('node-uuid');



var setUpTestStore = function (Parse) {
    Parse.Cloud.TestStore = {
        _store : {},

        saveObject: function (className, object) {
            
            if (!object.id) {
                object.id = uuid.v1();
            }

            if (!Parse.Cloud.TestStore._store[className]) {
                Parse.Cloud.TestStore._store[className] = {};
            }

            Parse.Cloud.TestStore._store[className][object.id] = object;
        },

        getObjectForId: function (className, id) {
            return Parse.Cloud.TestStore._store[className][id];
        },

        resetStore: function () {
            Parse.Cloud.TestStore._store = {};
        }
    }
}

var augmentParseObject = function (Parse) {
    // Now replace persistance calls with our own test implementations
    Parse.Object = Parse.Object || {};

    var realParseObjectExtend = Parse.Object.extend;
    Parse.Object.extend = function (className, protoProps, classProps) {

        var result = realParseObjectExtend.call(this, className, protoProps, classProps);
        
        result.prototype.save = function (options, arg2, arg3) {
            this.set(options);
            Parse.Cloud.TestStore.saveObject(className, this);
            return Parse.Promise.as(this);

        }

        return result;
    }
}

var augmentParseQuery = function (Parse) {
    // Replace query implementations with our own
    Parse.Query = Parse.Query || {};
    var realConstructor = Parse.Query;

    Parse.Query = function (objectClass) {
        realConstructor.call(this, objectClass);

        this.get = function (objectId, options) {
            var object = Parse.Cloud.TestStore.getObjectForId(objectClass, objectId);

            if (object && options.success) {
                options.success(object);
            } 
            else if (options.error) {
                options.error("No object with id " + objectId);
            }
        }
    }
}

var augmentParseCloudDefine = function (Parse, sinon) {
    Parse.Cloud = Parse.Cloud || {};
    Parse.Cloud.Simulator = {
        _functions: {},

        runFunction: function (fnName, params, user) {
            var request = {
                    params: params,
                    user: user
                },
                response = {
                    success: sinon.spy(),
                    error: sinon.spy()
                };
            Parse.Cloud.Simulator._functions[fnName](request, response);
            return response;
        },

        reset: function () {
            Parse.Cloud.Simulator._functions = {};
        }
    };

    Parse.Cloud.define = function (fnName, fn) {
        Parse.Cloud.Simulator._functions[fnName] = fn;
    };
}


var augmentParse = function (Parse, sinon) {
    setUpTestStore(Parse);
    augmentParseCloudDefine(Parse, sinon);
    augmentParseObject(Parse);
    augmentParseQuery(Parse);

    return Parse;
};

exports.Parse = augmentParse(Parse, sinon);