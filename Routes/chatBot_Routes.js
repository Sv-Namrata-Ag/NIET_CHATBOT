const express=require("express");
const chatBot_Controller = require("../Controller/chatBot_Controller");
const router=express.Router();

router.get("/",chatBot_Controller.getData);
module.exports=router;