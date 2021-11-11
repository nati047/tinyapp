const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const bodyParser = require("body-parser");
const json = require("body-parser/lib/types/json");
const PORT = 8080; // default port 8080
const  { getUserByEmail, emailLookup ,generateRandomString, urlsForUser, checkPassword, authenticateUser, encryptPassword} = require("./helpers");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const urlDatabase = {
  "b2xVn2": { LongURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { LongURL: "http://www.google.com", userID: "aJ48lW" },
  "1": { LongURL: "https://web.compass.lighthouselabs.ca/days/w03d2/activities/165", userID: "waka" }
};

const users = {
  'waka': {
    id: 'waka',
    email: 'isaacnatnael@gmail.com',  // given
    password: encryptPassword('123')
  }

};


 


app.get("/", (req, res) => {
  res.send("Hello User!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  const userIdCookie = req.session.user_id;
  const id = req.session.user_id;
  const urlsOfId = urlsForUser(id, urlDatabase);
  const templateVars = {
    urls: urlsOfId,
    user: users[userIdCookie]
  };

  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => { // display add new data pages
  const userIdCookie = req.session.user_id;
  if (req.session.user_id) {
    const templateVars = { user: users[userIdCookie] };
    return res.render("urls_new", templateVars);
  }
  res.redirect('/login');
});

app.post("/urls", (req, res) => { // add new shortURL - longURL pair to database
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = { LongURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => { // redirect to longURL web page
  const shortURL = req.params.shortURL;
  const urlToRedirectTo = urlDatabase[shortURL].LongURL;
  console.log('-------req.params', urlDatabase[shortURL].LongURL);
  res.redirect(urlToRedirectTo);
});

app.post('/urls/:shortURL/delete', (req, res) => { // remove shortURL - longURL pair from database
  const urlToDelete = req.params.shortURL;
  const loggedInUserId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const urlsOfId = urlsForUser(loggedInUserId);
  if (loggedInUserId) {
    for (let key in urlsOfId) {
      if (key === shortURL) {
        delete urlDatabase[urlToDelete];
        res.redirect('/urls');
        return;
      }
    }
  }
  res.status(403);
  res.send('Access for logged in users only\n');
});

app.post('/urls/:shortURL/edit', (req, res) => {  // replace longURL with new value from user
  const loggedInUserId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const urlsOfId = urlsForUser(loggedInUserId);
  if (loggedInUserId) {
    for (let key in urlsOfId) {
      if (key === shortURL) {
        urlDatabase[req.params.shortURL].LongURL = req.body.longURL;
        res.redirect('/urls');
        return;
      }
    }
  }
  res.statusCode = 403;
  res.send('Access for logged in users only\n');
});



app.post('/login', (req, res) => {
  const { email, password } = req.body; // get user's input password and email
  if (!authenticateUser(email, password, users)) {
    res.status(403);
    res.send('Invalid user name or passworrd!!!s');
    return;
  }
  req.session.user_id = getUserByEmail(email, users);
  res.redirect('/urls');
 
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
  
});

app.get('/register', (req, res) => {
  const userIdCookie = req.session.user_id;
  const templateVars = { user: users[userIdCookie] };
  res.render('registration', templateVars);
});


app.post('/register', (req, res) => {
  const userId = generateRandomString(4);
  const userInput = req.body;
  const emailPresent = emailLookup(userInput.email, users); // check if email is present in users object
  if (!userInput.email || !userInput.password) {
    res.statusCode(400);
    res.send('<h3>Invalid Input!</h3>');
    return;
  }
  if (emailPresent) {
    res.status(400);
    res.send('<h3>Account already exsists with this email!</>');
    return;
  }
  users[userId] = {
    id: userId,
    email: userInput.email,
    password: encryptPassword(userInput.password)
  };
  req.session.user_id = userId;
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const userIdCookie = req.session.user_id;
  const templateVars = { user: users[userIdCookie] };
  res.render('login', templateVars);

});

// app.get("/urls/:id", (req, res) => { // show shortend urls of user whose id is passed on the url
//   const id = req.params.id;
//   const userIdCookie = req.session.user_id;
//   const urlsOfId = urlsForUser(id);
//   const templateVars = {
//     urls: urlsOfId,
//     user: users[userIdCookie]
//   };
//     res.render("urls_index", templateVars);
//   });

app.get("/urls/:shortURL", (req, res) => { // show longURL info for given shortURL

  const templateVars = {
    urls: urlDatabase,
    shortURL: req.params.shortURL,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


