require("dotenv").config();
var express = require("express");
var bodyParser = require('body-parser');
var path = require("path");
var { Client } = require("pg");
var bcrypt = require("bcryptjs");
const jsonToken = require("jsonwebtoken");
const client = new Client({
    host: "localhost",
    port: 5432,
    user: "chimikey",
    password: "postgres",
    database: "postgres"
});

client.connect();


var exp = express();
var customViewPath = path.join(__dirname, "/customviews");
exp.set("view engine", "hbs")
exp.set("views", customViewPath)
exp.use(bodyParser.json());
exp.use(bodyParser.urlencoded({
    extended: true
}));

exp.get("/login", (req, response) => {
    response.render("login")
});


exp.post("/login", async(req, resp) => {
    const query = {
        // give the query a unique name
        text: 'SELECT * FROM student WHERE username = $1',
        values: [req.body.username],
    }
    const res = await client.query(query)
    if (res && res.rowCount > 0 && await bcrypt.compare(req.body.password, res.rows[0].password)) {
        const token = await jsonToken.sign({ _id: req.body.username }, process.env.JSONTOKENKEY)
        const text = 'UPDATE student SET tokens= $1 WHERE username = $2'
        const values = [token, req.body.username]

        const res = await client.query(text, values)
        if (res && res.rowCount > 0) {
            resp.render("loggedin", { username: req.body.username })
        } else {
            resp.render("error")
        }

    } else {
        resp.render("error", { eror: "username or password not correct" })
    }
});


exp.get("/register", async(req, resp) => {
    resp.render("register")
});
exp.get("/home", async(req, resp) => {
    resp.render("home")
});

exp.post("/register", async(req, resp) => {
    var bcyptPassssword = await bcrypt.hash(req.body.password, 10)

    const text = 'INSERT INTO student(username, password) VALUES($1, $2) RETURNING *'
    const values = [req.body.username, bcyptPassssword]

    const res = await client.query(text, values)
    if (res && res.rowCount > 0) {
        resp.render("success", { username: req.body.username })
    } else {
        resp.render("error")
    }

});
exp.listen(7772, () => {
    console.log("listening in port no. 7772")
});