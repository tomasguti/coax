/*
 * coux
 * https://github.com/jchris/coux
 *
 * Copyright (c) 2013 Chris Anderson
 * Licensed under the Apache license.
 */
var pax = require("pax"),
  request = require("request"),
  jreq = require("request").defaults({json:true});

// console.log(jreq)

function makeCouxCallback(cb) {
  return function(err, res, body){
    if (err) {
      cb(err, res, body);
    } else {
      if (res.statusCode >= 400) {
        cb(body || res.statusCode, res);
      } else {
        cb(null, body);
      }
    }
  };
}

function callPaxOrArgs(myPax, path) {
  if (myPax.uri) {
    return myPax.uri(path);
  } else {
    return myPax(path);
  }
}

function processArguments(myPax, urlOrOpts, cb) {
  if (urlOrOpts.uri || urlOrOpts.url) {
    // it's options
    urlOrOpts.uri = callPaxOrArgs(myPax, (urlOrOpts.uri || urlOrOpts.url));
    // console.log("urlOrOpts", urlOrOpts);
    return [urlOrOpts, cb];
  } else {
    // hope it's string or array
    // console.log("myPax(urlOrOpts)", myPax(urlOrOpts));
    return [callPaxOrArgs(myPax, urlOrOpts), cb];
  }
}


function makeCoux(myPax, verb) {
  var newCoux = function(url, cb) {
    var args = processArguments(myPax, url, cb);
    if (args[1]) {
      if (verb) {
        return jreq[verb](args[0].toString(), makeCouxCallback(args[1]));
      } else {
        return jreq(args[0].toString(), makeCouxCallback(args[1]));
      }
    } else {
      console.log("curry me b "+verb);
      return makeCoux(args[0], verb);
    }
  };
  if (!verb) {
    "get put post head del".split(" ").forEach(function(v){
      newCoux[v] = makeCoux(myPax, v);
    });
  }

  return newCoux;
}

var Coux = module.exports = function (url, cb) {
  var thisCoux = makeCoux(pax());
  return thisCoux(url, cb);
};

"get put post head del".split(" ").forEach(function(verb){
  Coux[verb] = function(url, cb) {
    var args = processArguments(pax(), url, cb);
    return jreq[verb](args[0].toString(), makeCouxCallback(args[1]));
  };
});