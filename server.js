  var express = require('express'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
  request = require("request"),
  session = require('express-session'),
  User = require('./models/user.js')

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'Q3UBzdH9GEfiRCTKbi5MTPyChpzXLsTD',
  saveUninitialized: true,
  resave: true
}));

// session.startSession(req, res, callback);

// app.get('/', function(req,res)
// {
//    renderView(req, res, 'signin.jade');
// });

app.get('/signin', function (req, res) 
{
    if(req.session.userId)
    {
        res.redirect('/config');
    }
    else
    {
        renderView(req, res, 'signin.jade', { user: req.user, url: req.url });
    }
});

app.get('/close', function (req, res) 
{
   renderView(req, res, 'close.jade');
});

app.get('/config', function (req, res) 
{
    var dropdownValue = "me";

    if(req.query!=null)
    {
        dropdownValue = req.query["selectedValue"];
    }

    var userId = req.session.userId;
    var accessToken = req.session.accessToken;

    var userArr = [];
    var repoUrlLink = "https://api.quizlet.com/2.0/users/" + userId + "/sets";

    switch(dropdownValue)
    {
        case "Favorites":
            repoUrlLink = "https://api.quizlet.com/2.0/users/" + userId + "/favorites";
            break;
        case "Recently studied":
            repoUrlLink = "https://api.quizlet.com/2.0/users/" + userId + "/studied";
            break;
        default:
            repoUrlLink = "https://api.quizlet.com/2.0/users/" + userId + "/sets";
    }

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', repoUrlLink, false);
    xmlHttp.setRequestHeader('Authorization', 'Bearer ' + accessToken);

    xmlHttp.onload = function () 
    {
        if (xmlHttp.status != 200) {
            //displayNoAccessMessage();
        }
        else {
            var result = JSON.parse(xmlHttp.responseText);
            var len = result.length;
            for (var i = 0; i < len; i++) {
                var user = new User();
                user.userid = userId;
                user.accessToken = accessToken;
                user.title = result[i].title;
                user.term_count = result[i].term_count;
                user.url = result[i].url;
                userArr.push({
                    user
                });
            }

            renderView(req, res, 'config.jade', { user: userArr });
        }
    }
    xmlHttp.send();
});

app.get('/callback', function (req, res)
{
   var code = req.query.code;

   var user = null;
   var options = 
   { 
      method: 'POST',
      url: 'https://api.quizlet.com/oauth/token',
      qs: 
      { 
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'https://841bf3ce.ngrok.io/callback'
      },

  headers: 
   { 
     'postman-token': '02a39785-041b-fc23-d82f-6426d5c70f42',
     'cache-control': 'no-cache',
     authorization: 'Basic U0NoMndEVTRnWjpDM2U0M1ZBU2p3TW5lc2p1TndIeXlN',
     'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' 
    } 
    };

    request(options, function (error, response, body) 
    {
        var sess= req.session;

        if (error) throw new Error(error);
        var obj = JSON.parse(body);            

        user = new User();
        user.userid = obj.user_id;
        user.accessToken = obj.access_token;

        req.session.userId = obj.user_id;
        req.session.accessToken = obj.access_token;

        res.redirect('/close');
    });
});

app.get('/auth/quizlet', function (req, res, next)
{
   res.redirect ("https://quizlet.com/authorize?response_type=code&client_id=SCh2wDU4gZ&scope=read&state=quizlet&redirect_url=https://841bf3ce.ngrok.io/callback");
});

function renderView(req, res, view, locals) {
  if (locals === undefined) {
    locals = {};
  }
  res.render(view, locals);
}

var port = process.env.port || 3000;
app.listen(port, function () {
  console.log('Listening on http://localhost:' + port);
});