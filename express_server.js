const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const PORT = 8080; 
const  { getUserByEmail, emailLookup ,generateRandomString, urlsForUser, authenticateUser, encryptPassword} = require("./helpers");

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
//object to store logged in users
const users = {  
 
};

app.get("/", (req, res) => {    
  const id = req.session.user_id;   // get id from browser session
  if (id) {  // check if user logged in
    const urlsOfId = urlsForUser(id, urlDatabase);
    const templateVars = {
      urls: urlsOfId,
      user: users[id]
    };
 
    res.render('urls_index', templateVars);
  }
  res.redirect('/login');
});

app.get('/urls', (req, res) => {
  const id = req.session.user_id;
  const urlsOfId = urlsForUser(id, urlDatabase);
  const templateVars = {
    urls: urlsOfId,
    user: users[id]
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
  if (!urlDatabase[shortURL]) {
    res.status(404);
    res.send('<h3>Page not found!</h3>');
    return;
  }
  const urlToRedirectTo = urlDatabase[shortURL].LongURL;
  
  res.redirect(urlToRedirectTo);
});

app.post('/urls/:shortURL/delete', (req, res) => { // remove shortURL - longURL pair from database
  const urlToDelete = req.params.shortURL;
  const loggedInUserId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const urlsOfId = urlsForUser(loggedInUserId, urlDatabase);
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
  const urlsOfId = urlsForUser(loggedInUserId, urlDatabase);
  if (loggedInUserId) {
    console.log(urlsOfId);
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

app.get('/register', (req, res) => {
  const userIdCookie = req.session.user_id;
  const templateVars = { user: users[userIdCookie] };
  res.render('registration', templateVars);
});


app.post('/register', (req, res) => {   // create new account
  const userId = generateRandomString(4);
  const userInput = req.body;    
  const emailPresent = emailLookup(userInput.email, users); // check if email is present in users object
  if (!userInput.email || !userInput.password) {  // check if user input is empty
    res.status(400);
    res.send('<h3>Invalid Input!</h3>');
    return;
  }
  if (emailPresent) {  // check if email already been used by an account
    res.status(400);
    res.send('<h3>Account already exsists with this email!</>');
    return;
  }
  // add new user to users object
  users[userId] = {
    id: userId,
    email: userInput.email,
    password: encryptPassword(userInput.password)
  };
  req.session.user_id = userId;  // set session cookie
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const userIdCookie = req.session.user_id;
  const templateVars = { user: users[userIdCookie] };
  res.render('login', templateVars);

});


app.get("/urls/:shortURL", (req, res) => { // show longURL info for given shortURL
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) { // check if given url doesn't match any in database object 
    res.status(404);
    res.send('<h3>Page not found</h3>');
    return;
  }
  if (userId && urlDatabase[shortURL].userID !== userId) { // check if logged in and url belongs to logged in user
    res.send('<h3>Access denied!</h3>');
    return;
  }
  const templateVars = {
    urls: urlDatabase,
    shortURL: req.params.shortURL,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);

});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


