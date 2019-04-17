const express = require("express");
const app = express();


app.get("/api",(req,res)=>{
	res.json({"a" : 10});
});

app.listen(3000);