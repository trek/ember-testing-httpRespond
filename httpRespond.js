/*
  Adds a `httpRespond` helper to Ember.Test for integration testing.
  This helper chains a promise and allows you to control where in the flow
  of execution an http response is returned. 

  ```javascript
  module("commenting on a post", function(){
    setup: function(){
      fakehr.start();
    },
    teardown: function(){
      fakehr.reset();
    }
  });

  test("people can browse to a post and leave a comment", function(){
    var comment = "I agree, Tom's hair does smell like newly fallen Portland rain."

    visit("/articles")
    .then(function(){
      equal(find(".loading-screen").length, 1);
    })
    .httpRespond("get", "/api/articles", [{id: 1, body: '...'}, {id: 2, body: '...'}])
    .click(".post:first")
    .fillIn(".comment-box", comment)
    .click(".comment-submit")
    .then(function(){
      equal(find(".spinner").length, 1);
    })
    .httpRespond("post", "/api/articles/1/comments", {id: 1, body: comment})
    .then(function(){
      equal(find("comment:contains('%@')".fmt(comment)).length, 1);
    });
  });
  ```
*/
Ember.Test.registerHelper('httpRespond', function(app, verb, url, body, status) {
  if(typeof body !== 'string'){ body = JSON.stringify(body); }

  var found = fakehr.match(verb.toUpperCase(), url)

  if (found){
    Ember.run(function() {
      found.respond(status || 200, {'content-type': 'application/json'}, body);
    });
  } else {
    throw("No request intercepted for " + verb.toUpperCase() + " " + url + ". Intercepted requests were: " + fakehr.requests.map(function(r){ return r.method + " " + r.url}).join(", "));
  }

  return wait(app);
});

/*
  This is mildly crazy. Ember.Test increments requets on ajax start
  so promises won't resolve until all xhrs complete, but were mocking
  them all, so we just immediately decrement them. If/When this gets moved
  into core, we can put pendingAjaxRequests checking behind a flag.
*/
Ember.Test.onInjectHelpers(function() {
  Ember.$(document).ajaxStart(function() {
    Ember.Test.pendingAjaxRequests--;
  });

  Ember.$(document).ajaxStop(function() {
    Ember.Test.pendingAjaxRequests++;
  });
});
