'use strict';

var Parse = require('parse').Parse,
    sinon = require('sinon'),
    _ = require('underscore');

var augmentParse = function (Parse, sinon) {
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

    // Now replace persistance calls with our own test implementations
    Parse.Object = Parse.Object || {};

    var realParseObjectExtend = Parse.Object.extend;

    Parse.Object.extend = function (className, protoProps, classProps) {

        var result = realParseObjectExtend.call(this, className, protoProps, classProps);
        
        result.prototype.save = function () {
            return Parse.Promise.as("Save successfull");
        }
        return result;
    }
    
    // Replace query implementations with our own
    Parse.Query = Parse.Query || {};
    var realConstructor = Parse.Query;
    
    Parse.Query = function (objectClass) {
        realConstructor(objectClass);

    this.first = function () {
         return Parse.Promise.as("Query successfull");
     }
    
    }


    return Parse;
};

exports.Parse = augmentParse(Parse, sinon);