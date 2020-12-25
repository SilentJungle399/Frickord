const socket = io();

Vue.component("contents", {
	template: `
	<div id="contents">
		<div v-if="login == true || checkLogin() == true">
			<servers :author="author" @bad-cookie="resetLogin"></servers>
		</div>
		<div v-else>
			<login @logged-in="loggedin"></login>
		</div>
	</div>
	`,
	data() {
		return {
			login: this.checkLogin(),
			author: null
		}
	},
	methods: {
		resetLogin() {
			this.login = false;
			this.author = null;
		},
		loggedin(author) {
			this.login = true;
			this.author = author;
		},
		checkLogin() {
			const username = $cookies.get("username");
			const password = $cookies.get("password");
			if (!username || !password) {
				return false
			}
			const comp = this;
			const xhttp = new XMLHttpRequest();
			xhttp.open("GET", "https://frickord.repl.co/validate?"+"username="+username+"&password="+password, true); 
			xhttp.send();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					if (this.responseText !== "true") {
						return false
					} else {
						comp.login = true;
						comp.author = username;
						return true
					}
				}
			}
		}
	}
})

Vue.component('servers', {
	template: `
		<div class="servers">
			<div class="serverlist">
				<button v-for="server in servers" :key="server.id" class="server">{{ server.name }}</button>
			<channels @bad-cookie="resetLogin" :server="servers.base" :author="author" :msgs="msgs"></channels>
		</div>
		`,
	props: {
		author: {
			type: String,
			require: true
		}
	},
	data() {
		return {
			scurrent: "base",
			msgs: [],
			servers: [
				{
					id: 2946294638596742,
					name: "base"
				}, {
					id: 3294724939357264, 
					name: "wtf"
				}
			],
		}
	},
	methods: {
		resetLogin() {
			this.$emit("bad-cookie")
		}
	},
	beforeMount() {
		const comp = this;
		socket.on("newmsg", function(data) {
			let least = null;

			while (data.length > 0) {
				// ordering data acc to time
				for (const item of data) {
					if (!least) {
						least = item
					} else {
						if (least.timeflake > item.timeflake) {
							least = item
						}
					}
				}
				
				// formatting the date
				let date = new Date(least.timeflake)
				let time = "";
				let min = date.getMinutes() < 10 ? "0" : "";
				if (date.getHours() > 12) {
					stuff = date.getHours() - 12
					time += stuff + ":" + min + date.getMinutes() + " PM"
				} else {
					stuff = date.getHours()
					time += stuff + ":" + min + date.getMinutes() + " AM"
				}
				let dateret = time + " " + date.getDate()+"/"+date.getMonth()+"/"+date.getFullYear()
				
				// fixing order
				if (comp.msgs.length > 0) {
					if (comp.msgs[comp.msgs.length - 1][0].toString() === least.author) {
						comp.msgs[comp.msgs.length - 1][1].push(least.message)
					} else {
						comp.msgs.push([least.author, [least.message], dateret])
					}
				} else {
					comp.msgs.push([least.author, [least.message], dateret])
				}
				data.splice(data.indexOf(least), 1)
				least = null
			}
		})
	}
})

Vue.component('channels', {
	template: `
		<div class="channels">
			<div class="chn-list">
				<button class="channel" v-for="channel in channels" :key="channel.id">{{ channel.name }}</button>
			</div>
			<div class="userinfo"><div class="userpfp"><img class="userpfpimage" src="images/dummy.png"></div><div class="username">{{ username }}</div></div>
			<message-area @bad-cookie="resetLogin" :author="author" :msgs="msgs"></message-area>
		</div>
		`,
	props: {
		msgs: {
			type: Array,
			required: true
		},
		author: {
			type: String,
			require: true
		}
	},
	data() {
		return {
			username: $cookies.get("username"),
			channels: {
				2946294638596742: [
					{
						id: 3759362548592642,
						name: "Haha"
					}, {
						id: 2840572486936294, 
						name: "Ok boomer"
					}
				], 
				3294724939357264 :[
					{
						id: 4857302395729404,
						name: "Haha"
					}, {
						id: 1056394759204258, 
						name: "Ok boomer"
					}
				]
			}
		}
	},
	methods: {
		resetLogin() {
			this.$emit("bad-cookie")
		}
	}
})

Vue.component("login", {
	template: `
		<div class="login-container">
			<div class="login" v-if="accexists">
				<h2>Login</h2>
				<input type="text" placeholder="Username" v-model="author" name="username" id="username" @keypress.enter="valForm"><br>
				<input type="password" placeholder="Password" v-model="password" name="password" id="password" @keypress.enter="valForm"><br>
				<button class="login-button" @click="valForm">Login</button><br><br><br><button class="login-button" @click="accexists = false">Create account</button>
			</div>
			<div class="create-acc" v-else-if="!accexists">
				<h2>Create Account</h2>
				<div>{{ result }}</div>
				<input type="text" placeholder="Username" v-model="username" name="username" id="username" @keypress.enter="valCreateacc"><br>
				<input type="email" placeholder="Email" v-model="email" name="email" id="email" @keypress.enter="valCreateacc"><br>
				<input type="password" placeholder="Create Password" v-model="cpassword" name="cpassword" id="cpassword" @keypress.enter="valCreateacc"><br>
				<input type="password" placeholder="Re-enter Password" v-model="repassword" name="repassword" id="repassword" @keypress.enter="valCreateacc"><br>
				<button class="login-button" @click="valCreateacc">Create Account</button><br><br><br><button class="login-button" @click="accexists = true">Login instead</button>
			</div>
		</div>`,
	props: {
		login: {
			type: Boolean,
			required: true,
			default: false
		}
	},
	data() {
		return {
			accexists: true,
			author: null,
			password: null,
			username: null, 
			email: null,
			cpassword: null,
			repassword: null,
			result: ""
		}
	},
	methods: {
		valCreateacc() {
			const comp = this;
			if (!this.username || !this.email || !this.cpassword || !this.repassword) {
				return alert("Please fill all the fields!")
			}
			if (this.username.length > 15) return alert("The username cannot be longer than 15 character.");
			if (this.email.length > 50) return alert("The email cannot be longer than 50 character");
			if (this.cpassword.length > 15) return alert("The password cannot be longer than 15 character");
		
			if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.email)) {
				return alert("Please enter a valid email address!")
			} else if (this.cpassword !== this.repassword) {
				return alert("The passwords do not match.")
			} else {
				const xhttp = new XMLHttpRequest();
				xhttp.open("POST", "https://frickord.repl.co/newacc", true); 
				xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				xhttp.send("username="+this.username+"&password="+this.cpassword+"&email="+this.email);
				xhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						comp.result = this.responseText
					}
					comp.result += " Click 'Login instead' button to login."
				}
			}
		},
		valForm() {
			if (!this.author || !this.password) {
				return alert("Please enter your username and password!")
			}
			const comp = this;
			const xhttp = new XMLHttpRequest();
			xhttp.open("GET", "https://frickord.repl.co/validate?"+"username="+this.author+"&password="+this.password, true); 
			xhttp.send();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					if (this.responseText !== "true") {
						return alert("Wrong password! Please try again!")
					} else {
						$cookies.set("username", comp.author)
						$cookies.set("password", comp.password)
						return comp.$emit("logged-in", comp.author)
					}
				}
			}
		}
	}
})

Vue.component("message-area", {
	template: `
		<div class="messagearea">
			<div class="messages">
				<div id="scrarea" class="scrarea">
					<div class="msgdata" v-for="msg of msgs">
						<table border=0 class="msgarng">
							<tr>
								<td rowspan=2><img class="msgauthorpfpimage" src="images/dummy.png"></td>
								<td><div class="msgauthorname">{{ msg[0] }}</div><span class="msgtimestamp">{{ msg[2] }}</span></td>
							</tr>
							
							<tr>
								<td><div class="message">{{ msg[1][0] }}</div></td>
							</tr>
							<tr v-for="ms in msg[1].slice(1)">
							<td></td><td>{{ ms }}</td>
							</tr>
						</table>
					</div>
				</div>
				<input class="msgbox" placeholder="Type your message..." id="textbox" v-model="message" type="text" @keyup.enter="sendMessage">
			</div>
		</div>
	`,
	props: {
		msgs: {
			type: Array,
			required: true
		},
		author: {
			type: String,
			require: true
		}
	},
	data() {
		return {
			message: null
		}
	},
	methods: {
		sendMessage() {
			if (!this.message) {
				return
			}
			if (!$cookies.get("username") || !$cookies.get("password")) {
				this.$emit("bad-cookie")
				return
			}
			if (this.message.length > 150) {
				return alert("Message length above 150 characters.\nP.S. Stop breaking my stuff.")
			}
			socket.emit("newmsg", {
				serverID: "1234",
				channelID: "1234",
				author: this.author,
				message: this.message,
				timeflake: Date.now()
			})

			this.message = null
		}
	},
	mounted() {
		socket.emit("channelConn", {
			serverID: "1234",
			channelID: "1234",
		})
	},
	updated() {
		const elem = document.getElementById("scrarea");
		elem.scrollTop = elem.scrollHeight
	}
});

const app = new Vue({
	el: "#app"
});