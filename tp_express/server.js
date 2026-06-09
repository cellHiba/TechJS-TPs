const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const app = express();

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/bookdb")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// View Engine
app.set("view engine", "pug");
app.set("views", "./views");

// Middleware
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// User Schema
const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model("User", UserSchema);

// Book Schema
const BookSchema = new mongoose.Schema({
    title: String,
    author: String
});

const Book = mongoose.model("Book", BookSchema);

// Passport Configuration
passport.use(new LocalStrategy(async (username, password, done) => {

    const user = await User.findOne({ username });

    if (!user) {
        return done(null, false);
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return done(null, false);
    }

    return done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {

    const user = await User.findById(id);

    done(null, user);
});

// Authentication Middleware
function ensureAuthenticated(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect("/login");
}

// Routes

app.get("/", (req, res) => {
    res.redirect("/login");
});

// Register
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {

    const { username, password } = req.body;

    const exist = await User.findOne({ username });

    if (exist) {
        return res.send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
        username,
        password: hashedPassword
    });

    res.redirect("/login");
});

// Login
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login",
    passport.authenticate("local", {
        successRedirect: "/books",
        failureRedirect: "/login"
    })
);

// Logout
app.get("/logout", (req, res, next) => {

    req.logout(function(err) {

        if (err) {
            return next(err);
        }

        res.redirect("/login");
    });
});

// Books
app.get("/books", ensureAuthenticated, async (req, res) => {

    const books = await Book.find();

    res.render("books", { books });
});

app.post("/books", ensureAuthenticated, async (req, res) => {

    const { title, author } = req.body;

    await Book.create({
        title,
        author
    });

    res.redirect("/books");
});

app.post("/books/delete/:id",
    ensureAuthenticated,
    async (req, res) => {

        await Book.findByIdAndDelete(req.params.id);

        res.redirect("/books");
    });

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});