const express = require("express");
const session = require('express-session');
const formidable = require("formidable");
const fs = require("fs");
const crypto = require("crypto");
const app = express();

// 开静态
app.use(express.static("./"));
 
// 配置session，固定语法，手册：
// https://www.npmjs.com/package/express-session
app.set('trust proxy', 1);
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));

// 执行登录
app.post("/login",(req,res)=>{
	// 得到POST请求的username和password
	var form = new formidable.IncomingForm();
	form.parse(req,(err,fileds)=>{
		const username = fileds.username;
		const password = fileds.password;
		// 给用户传上来的密码加密
		const password_sha256 = crypto.createHash("sha256").update(password + "" + password).digest("hex");
		// 使用fs模块读取小数据库，依次比对，看看他是谁
		fs.readFile("./db/users.txt",(err,content)=>{
			var arr = JSON.parse(content.toString());
			// 依次比对
			for(let i = 0 ; i < arr.length ; i++){
				if(arr[i].username == username && arr[i].password == password_sha256){
					// 匹配了。下发session是对这个用户的最高奖赏
					req.session.login = true;
					req.session.username = username;
					// 返回结果
					res.json({"result":1});
					// 不在执行了
					return;
				}
			}
			// 程序能够执行到这里，表示没有找到匹配的人
			// 返回错误结果
			res.json({"result" : -1});
		});
	});
});


// 查询当前登录的人的信息
app.get("/me",(req,res)=>{
	// 先看他有没有session
	if(req.session.login == true){
		// 查询数据库，查更多这个人的信息
		fs.readFile("./db/users.txt",(err,content)=>{
			var arr = JSON.parse(content.toString());
			for(let i = 0 ; i < arr.length ; i++){
				if(arr[i].username == req.session.username){
					// 匹配了
					// 返回结果
					res.json({
						"nickname" : arr[i].nickname,
						"avatar" : arr[i].avatar,
						"username" : arr[i].username
					});
				}
			}
		});	
	}else{
		res.json({"err" : -4});
	}
});


app.listen(3000);