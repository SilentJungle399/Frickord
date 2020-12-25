const express = require("express");
const bodyParser = require('body-parser');
const fetch = require("node-fetch")
const path = require('path');
const logger = require('morgan');
const app = express();
const http = require('http').Server(app)
const firebase = require("firebase-admin");
const io = require('socket.io')(http);

firebase.initializeApp({
	credential: firebase.credential.cert({
		type: process.env.type,
		project_id: process.env.project_id,
		private_key_id: process.env.private_key_id,
		private_key: process.env.private_key,
		client_email: process.env.client_email,
		client_id: process.env.client_id,
		auth_uri: process.env.auth_uri,
		token_uri: process.env.token_uri,
		auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
		client_x509_cert_url: process.env.client_x509_cert_url
	})
});

const db = firebase.firestore();

io.on('connection', function(socket) {
	socket.on("channelConn", (data) => {
		db.collection("servers").doc(data.serverID).collection(data.channelID).onSnapshot(querySnapshot => {
			const temp = [];
			querySnapshot.docChanges().forEach(change => {
				temp.push(change.doc.data())
			});
			socket.emit("newmsg", temp)
		})
	})
	socket.on('newmsg', function(data) {
		db.collection("servers").doc(data.serverID).collection(data.channelID).add({
			author: data.author,
			message: data.message,
			timeflake: data.timeflake
		})
	})
});


app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/getmsgs", (req, res) => {
	fetch(`https://database.frickord.repl.co/getmsg`)
	.then(reqs => reqs.json())
	.then(text => res.send(text["messages"]))
});

app.get("/validate", (req, res) => {
	fetch("https://database.frickord.repl.co/validate?username="+req.query.username+"&password="+req.query.password)
	.then(reqs => reqs.json())
	.then(text => res.send(text.valid)).catch(err => {
		res.send("false")
	})
});

app.get("/", (req, res) => {
	res.redirect("/app")
});

app.post("/newmsg", (req, res) => {
	if (req.body.msg.length > 75) {
		return
	}
	pusher.trigger('messages', 'message_add', {message: req.body});
	msgs.push([req.body.author, req.body.msg])
	fetch(`https://database.frickord.repl.co/addmessage?author=${req.body.author}&message=${req.body.msg}`, {
		headers: {
			"token": process.env.token
		}
	}).then(reqs => reqs.text())
	.then(text => text)
	res.status(200).send();
});

app.post('/newacc', (req, res) => {
	fetch("https://database.frickord.repl.co/createacc?username="+req.body.username+"&password="+req.body.password+"&email="+req.body.email)
	.then(reqs => reqs.text())
	.then(text => res.send(text))
});

app.use(express.static('public', {
	 extensions: ['html', 'htm']
}));
http.listen(6969);