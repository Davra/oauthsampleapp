"use strict";

/******************************************************************************
 This is a simple express js microservice which serves-out static content from 
 the public subfolder. All static content be they html files, images etc should
 be placed in public or subfolders for the public dir
 e.g. a common structure looks as follows:
 public
      |_ index.html
      |_ css
           |_style.css
      |_ imgs
           |_ logo.png
      |_ js
          |_ index.js
*/

const express = require('express');
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2").Strategy;
const request = require("request");

const app = express();

var sess = {
  secret: 'keyboard cat',
  cookie: {}
};
 
app.use(session(sess));

var pp = passport.initialize();
app.use(pp);
var ppSession = passport.session();
app.use(ppSession);

passport.serializeUser(function(user, cb) {
  cb(null, JSON.stringify(user));
});

passport.deserializeUser(function(userSz, cb) {
  try{
    var userObj = JSON.parse(userSz);
    cb(null, userObj);
  }
  catch(err){
    cb(err);
  }
});

let prodConfig = {
    authorizationURL: 'http://test1.feature.eemlive.com/oauth/authorize',
    tokenURL: 'http://test1.feature.eemlive.com/oauth/token',
    clientID: "AqFp4U4OsjjNhZxGYLRu",
    clientSecret: "lhT7PvEmBnyzO0HjwuYD1luSHRnO6MoHx80vrAXt",
    callbackURL: "http://spaoauth-test1.apps.feature.eemlive.com/callback",
    passReqToCallback: true
  };
  
let devConfig = {
    authorizationURL: 'http://test1.feature.eemlive.com/oauth/authorize',
    tokenURL: 'http://test1.feature.eemlive.com/oauth/token',
    clientID: "VZXvzTO4g6KCk5fkgNJa",
    clientSecret: "9rUV2Z0fmMwIAeIaARY3nt3tSGro5TKA5rGSCkmE",
    callbackURL: "http://ffc3dcfe-bdef-4072-9a75-12e155320a60.apps.feature.eemlive.com/callback",
    passReqToCallback: true
  };

passport.use(new OAuth2Strategy(prodConfig,
  function(req, accessToken, refreshToken, profile, cb) {
    
    console.log("Successfully authorized: %s", accessToken);
    

    if(req.session){
        req.session.oauth = {accessToken: accessToken, refreshToken: refreshToken};
    }
    cb(null, {id: profile.id});
  }
));

let staticMW = express.static('public');

app.get("/user.html", (req, res, next) => {
    if(!req.user){
        res.redirect("/login");
        return;
    }
    else{
        next();
    }
}, staticMW);

app.use(staticMW);

app.get("/user", (req, res) => {
    
    if(!req.user){
        res.redirect("/login");
        return;
    }

    request.get("http://test1.feature.eemlive.com/user", {
        json: true,
        headers: {
            "User-Agent": req.headers["user-agent"],
            "Authorization": "Bearer " + req.session.oauth.accessToken
        }
    }, (err, response, body) => {
        if(err){
            res.writeHead(500);
            res.write(err);
            res.end();
        }
        else if(response.statusCode !== 200){
            res.writeHead(response.statusCode);
            res.write(body);
            res.end();
        }
        else{
            res.writeHead(200, {"content-type": "application/json"});
            res.write(JSON.stringify(body));
            res.end();
        }
    });
});

app.get("/devices", (req, res) => {
    
    if(!req.user){
        res.redirect("/login");
        return;
    }
    
    request.get("http://test1.feature.eemlive.com/api/v1/devices", {
        json: true,
        headers: {
            "User-Agent": req.headers["user-agent"],
            "Authorization": "Bearer " + req.session.oauth.accessToken
        }
    }, (err, response, body) => {
        if(err){
            res.writeHead(500);
            res.write(err);
            res.end();
        }
        else if(response.statusCode !== 200){
            res.writeHead(response.statusCode);
            res.write(body);
            res.end();
        }
        else{
            res.writeHead(200, {"content-type": "application/json"});
            res.write(JSON.stringify(body));
            res.end();
        }
    });
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect("/index.html");
});

app.get("/login", passport.authenticate("oauth2"), (req, res) => {
    res.redirect("/index.html");
});

app.get('/callback',
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log("Callback...got token from Davra Platform");
    res.redirect('/user.html');
  });

const SERVER_PORT = 8080;
app.listen(SERVER_PORT, function () {
  console.log('davra.com node microservice listening on port ' + SERVER_PORT + '!');
});