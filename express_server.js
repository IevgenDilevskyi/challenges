const express = require("express");
const app = express();
const PORT = 1234;

app.get("/", (req, res) => {
  res.send("Hello World!!!");
  // const id = req.session.user_id;
  // if (id) {
  //   res.redirect("/urls");
  //   return;
  // }
  // res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const id = req.session.user_id;
  const filteredURLs = urlsForUser(id); // URLs that belong to current user
  const templateVars = { urls: filteredURLs, user: users[id] };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const id = req.session.user_id;
  const templateVars = { user: users[id] };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const id = req.session.user_id;
  const templateVars = { user: users[id] };
  res.render("login", templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  const templateVars = { user: users[id] };
  if (id) {
    return res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const userID = urlDatabase[shortURL].userID;
  const templateVars = {
    shortURL,
    longURL,
    userID,
    user: users[req.session.user_id],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = `https://${urlDatabase[shortURL].longURL}`;
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  const id = req.session.user_id;
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: id };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.session.user_id;
  const shortUrl = req.params.shortURL;
  if (id !== urlDatabase[shortUrl].userID) {
    // Checks if ID of the user who wants to delete URL equals userID who created this url
    res.status(403).send("You can't perform this operation");
  } else {
    delete urlDatabase[shortUrl];
    res.redirect(`/urls`);
  }
});

app.post("/urls/:id", (req, res) => {
  const id = req.session.user_id; // Current user's ID
  const shortUrl = req.params.id; // Short URL that user wants to edit
  if (id !== urlDatabase[shortUrl].userID) {
    // Checks if ID of the user who wants to edit url equals userID who created this url
    res.status(403).send("You can't edit URLs of other users");
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect(`/urls`);
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const existUser = getUserByEmail(email, users);
  if (!existUser) {
    // Checks if email exists in users database
    return res.status(403).send("Wrong user's email");
  }
  const existID = existUser.id;
  if (!bcrypt.compareSync(req.body.password, users[existID].password)) {
    // Compares passwords
    return res.status(403).send("Email and Password do not match");
  }
  req.session.user_id = existID;
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  req.session = null; //Clears the cookies
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const plainTextPassword = req.body.password;
  const password = bcrypt.hashSync(plainTextPassword, 10); // Hashing the password

  if (email === "" || plainTextPassword === "") {
    // Checks if registration email or password fields are empty
    return res.status(400).send("Email and Password fields can't be empty.");
  } else if (!getUserByEmail(email, users)) {
    // Checks if email already exists
    users[id] = { id, email, password };
    req.session.user_id = id;
    res.redirect("/urls");
    return;
  }
  res.status(400).send("This email is already used. Choose another one.");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
