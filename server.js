
import * as dotenv from 'dotenv'; 
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 8010;

//pusher

const pusher = new Pusher({
    appId: "1478338",
    key: "bfe0ff0c6834158c7731",
    secret: "47cdc29fffba53c72934",
    cluster: "ap2",
    useTLS: true
  });

  const db = mongoose.connection;

  db.once("open", ()=>{
//   console.log("DB connected");
  const msgCollection = db.collection("messagecontents");

  const changeStream = msgCollection.watch();

  changeStream.on("change",(change)=>{
    console.log(change);

    if(change.operationType === "insert"){
        const messageDetails = change.fullDocument;
        pusher.trigger("messages","inserted",{
            name:messageDetails.name,
            message:messageDetails.message,
            timestamp:messageDetails.timestamp,
            received:messageDetails.received,
        });
     }   else{
        console.log("Error trigerring Pusher");
        }   
  })
 })

//middleware
app.use(express.json());
app.use(cors());

//DB config
const password = process.env.PASSWORD;
const connection_url="mongodb+srv://admin-1:"+password+"@cluster0.kye6xho.mongodb.net/whatsappDB?retryWrites=true&w=majority";

mongoose.connect(connection_url,{useUnifiedTopology: true});
//?????

//api routes
app.get("/",(req,res)=>res.status(200).send("Hello world"));

app.get("/messages/sync",(req,res)=>{
    Messages.find((err,data)=> {
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        } 
    })
})


app.post("/messages/new",(req,res)=>{
   const dbMessage = req.body;
   
   Messages.create(dbMessage,(err,data) =>{
    if(err){
        res.status(500).send(err);
    }else{
        res.status(201).send(data);
    }
   })
})
//listen

app.listen(port,() => console.log(`Listening on local host: ${port}`));