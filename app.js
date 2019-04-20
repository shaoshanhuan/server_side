const express = require("express");
const session = require('express-session');
const formidable = require("formidable");
const fs = require("fs");
const crypto = require("crypto");
const gm = require('gm');
const path = require("path");
const url = require("url");
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

// 上传
app.post("/uploadavatar",(req,res)=>{
	var form = new formidable.IncomingForm();
	// 设置上传目录
	form.uploadDir = "./uploads"
	// 保留扩展名
	form.keepExtensions = true;

	form.parse(req,(err,fields,files)=>{
		 
		if(files.file.type != "image/jpeg" && files.file.type != "image/png"){
			// 图片类型不对
			res.json({"result":-3});
		}else if(files.file.size > 200 * 1024){
			// 图片文件体积不能超过200kb
			res.json({"result":-2});
		}else{
			// 文件的宽度和高度尺寸
			gm(path.resolve(__dirname , files.file.path)).size((err , size)=>{
				if(size.width >= 100 && size.width <= 1500 && size.height >= 100 && size.height <= 1500){
					// 成功了，向前端回调文件尺寸、宽度和高度、文件名
					res.json({
						"result":1,
						"width":size.width,
						"height":size.height,
						"filename":path.basename(files.file.path)		// 只给前端文件名即可，路径不用给
					});
				}else{
					// 图片的宽度和高度不在范围内
					res.json({"result":-4});
				}
			});
			
		}
	});
})


app.listen(3000);