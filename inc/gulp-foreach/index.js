'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var Stream = require('stream');
var utils = require('util');
var Readable = Stream.Readable;



module.exports = function (func) {
  
  if (!func || typeof func != 'function') {
    throw new gutil.PluginError('gulp-forEach', '`forEach` must be called with one parameter, a function');
  }
  
  var openStreams = [];
  var ended = false;
  var error = false;
  
    
  function closeStreamIfNoMoreOpenStreams(stream){
    if(openStreams.length == 0){
      if(ended && !error){
        stream.push(null);
      }
    }
  }
  
  return through.obj(function(data, enc, done){
    
    if (data.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-forEach', 'Streaming not supported'));
      return;
    }    
    
    var self = this;    
    var notYetRead = true;
    
    
    var readStream = new Readable({objectMode: true});
    readStream._read = function(){
      
      if(notYetRead){
        notYetRead = false;
        readStream.push(data);
      }else{
        readStream.push(null);
      }
    };
        
    var resultStream = func(readStream, data);
    
    if(resultStream){
    
      openStreams.push(resultStream);

      resultStream.on('end', function(){
        openStreams.splice(openStreams.indexOf(resultStream), 1);
        closeStreamIfNoMoreOpenStreams(self);
        done();
      });

      resultStream.on('data', function(result){
        self.push(result);
      });

      resultStream.on('error', function(error){
        console.error("error!");
        done(error);
      });
      
    }else{
      closeStreamIfNoMoreOpenStreams(self);
    }      
        
  }, function(){
    ended = true;
    closeStreamIfNoMoreOpenStreams(this);
  });
};
