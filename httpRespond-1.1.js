function handleHttpRespond(app, verb, url, body, status) {
  if(typeof body !== 'string'){ body = JSON.stringify(body); }

  var found = fakehr.match(verb.toUpperCase(), url)

  if (found){
    Ember.run(function() {
      found.respond(status || 200, {'content-type': 'application/json'}, body);
    });
  } else {
    throw new Ember.Error("No request intercepted for " + verb.toUpperCase() + " " + url + ". Intercepted requests were: " + fakehr.requests.map(function(r){ return r.method + " " + r.url}).join(", "));
  }
  return wait(app);
}

Ember.Test.registerAsyncHelper('visitAndRespond', function(app, path, verb, url, body, status) {
  var router = app.__container__.lookup('router:main');
  router.location.setURL(path);

  if (app._readinessDeferrals > 0) {
    router['initialURL'] = path;
    Ember.run(app, 'advanceReadiness');
    delete router['initialURL'];
  } else {
    Ember.run(app, app.handleURL, path);
  }

  handleHttpRespond(app, verb, url, body, status);
});

Ember.Test.registerAsyncHelper('httpRespond', handleHttpRespond);

/*
 This is mildly crazy. Ember.Test increments requets on ajax start
 so promises won't resolve until all xhrs complete, but were mocking
 them all, so we just remove the ajaxStart and ajaxStop callbacks
 until we can merge into master and put some of this behind flags.
 */
Ember.Test.onInjectHelpers(function() {
  Ember.$(document).unbind("ajaxStart ajaxStop ajaxSend ajaxComplete");
});
