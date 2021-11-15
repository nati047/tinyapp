const bcrypt = require('bcryptjs');

const getUserByEmail = (email, usersList) => {
  for (let userId in usersList) {
    if (usersList[userId].email === email) {
      return userId;
    }
  }
  return undefined;
};
 
const generateRandomString = (length) => {
  let randomString = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * charactersLength));

  }
  return randomString;
};

const emailLookup = (emailToCheck, usersList) => {
  for (let id in usersList) {
    if (usersList[id].email === emailToCheck) {
      return true;
    }
  }
  return false;
};

const urlsForUser = (id, urlDatabase) => {
  let availableUrlsList = {};
  for (let key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      availableUrlsList[key] = urlDatabase[key];
    }
  }
  return availableUrlsList;
};

const encryptPassword = (password) =>{
  const hashedPassword = bcrypt.hashSync(password, 10);
  return hashedPassword;
};

const checkPassword = (text, hashedPass) =>{
  return bcrypt.compareSync(text, hashedPass);
};

const authenticateUser = (email, password, list) => {
  const userId = getUserByEmail(email, list);
  if (userId) {
    if (checkPassword(password, list[userId].password)) {  //  check password
      return true;
    }
  }
  return false;
};
module.exports = { getUserByEmail, emailLookup ,generateRandomString, urlsForUser, checkPassword, authenticateUser, encryptPassword};

