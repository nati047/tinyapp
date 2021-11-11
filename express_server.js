const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const json = require("body-parser/lib/types/json");
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": {LongURL:"http://www.lighthouselabs.ca", userID: "aJ48lW"},
  "9sm5xK": {LongURL:"http://www.google.com", userID: "aJ48lW"},
       "1": {LongURL:"https://web.compass.lighthouselabs.ca/days/w03d2/activities/165", userID: "waka"}
};

const users = {
  'waka' : {id: 'waka',
  email: 'isaacnatnael@gmail.com',
  password: '123'}

}

const generateRandomString = (length) => {
  let randomString = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * charactersLength));

  }
  return randomString;
}

const emailLookup = (emailToCheck, obj) => {
  for (let id in obj) {
    if (emailToCheck === obj[id].email) {
      return true;
    }
  }
  return false;
}

const urlsForUser = (id) =>{
  let availableUrlsList = {}
  for(let key in urlDatabase){
    if(id === urlDatabase[key].userID) {
      availableUrlsList[key] = urlDatabase[key];
    }
  }
  return availableUrlsList;
}


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
  const userIdCookie = req.cookies['user_id'];
    const id = req.cookies['user_id'];
    const urlsOfId = urlsForUser(id);
    const templateVars = {
      urls: urlsOfId,
      user: users[userIdCookie]
    };
   
   res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => { // display add new data pages
  const userIdCookie = req.cookies['user_id']
  if(req.cookies.user_id){
   const templateVars = { user: users[userIdCookie] }
   res.render("urls_new", templateVars);
  }
  res.redirect('/login');
});

app.post("/urls", (req, res) => { // add new shortURL - longURL pair to database
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = { LongURL: req.body.longURL , userID: req.cookies['user_id'] };
  console.log('users-------' , users );
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => { // redirect to longURL web page
  const longURL = urlDatabase[req.params.shortURL].LongURL;
  if (!longURL) {
    res.status(404)
    res.send(`404 Page not found`)
    return;
  }
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => { // remove shortURL - longURL pair from database
  const urlToDelete = req.params.shortURL;
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
})

app.post('/urls/:shortURL/edit', (req, res) => {  // replace longURL with new value from user
  urlDatabase[req.params.shortURL].LongURL = req.body.longURL;
  res.redirect('/urls');
})

app.post('/login', (req, res) => {
  const { email, password } = req.body; // get user's input password and email
  if (emailLookup(email, users)) {
    for (let userId in users) {
      if (users[userId].email === email) {
        if (users[userId].password === password) {
          res.cookie('user_id', userId);
          res.redirect('/urls');
          return;
        }
        res.statusCode = 403;
        res.send('Password incorrect');
        return;
      }
    }

  }
  res.statusCode = 403;
  res.send('No account found under this email');
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

app.get('/register', (req, res) => {
  const userIdCookie = req.cookies['user_id'];
  const templateVars = { user: users[userIdCookie] }
  res.render('registration', templateVars);
});


app.post('/register', (req, res) => {
  const userId = generateRandomString(4);
  const userInput = req.body;
  const emailPresent = emailLookup(userInput.email, users); // check if email is present in users object
  if (!userInput.email || !userInput.password) {
    res.statusCode = 400;
    res.send('<h3>Invalid Input!</h3>')
    return;
  }
  if (emailPresent) {
    res.statusCode = 400;
    res.send('<h3>Account already exsists with this email!</>');
    return;
  }
  users[userId] = {
    id: userId,
    email: userInput.email,
    password: userInput.password
  }
  res.cookie('user_id', userId);
  res.redirect('/urls')
})

app.get('/login', (req, res) => {
  const userIdCookie = req.cookies['user_id']
  const templateVars = { user: users[userIdCookie] }
  res.render('login', templateVars);

});

// app.get("/urls/:id", (req, res) => { // show shortend urls of user whose id is passed on the url 
//   const id = req.params.id;
//   const userIdCookie = req.cookies['user_id'];
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
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

