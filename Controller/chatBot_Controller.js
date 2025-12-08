const chatBot_Controller={
    getData:(req,res)=>{
        res.status(200).json({msg:"chatbot"});
    }
}

module.exports=chatBot_Controller;