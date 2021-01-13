const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const port = 5000;
const config = require("./config/key");
const { auth } =  require("./middleware/auth");

const { User } = require("./models/User");

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser());

mongoose.connect(config.mongoURI,{
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(()=>console.log('MongoDB Connected...'))
    .catch(err => console.log(err))

app.get('/', (req,res) => res.send("hellow"))

app.post('/api/login', (req,res)=>{
    
    User.findOne({ email:req.body.email}, (err,userInfo)=>{
        if(!userInfo){
            return res.json({ loginSuccess: false, message: "제공된 이메일에 해당되는 유저가 없습니다."})
        }
        userInfo.comparePassword(req.body.password, (err, isMatch)=>{
            if(!isMatch)
            return res.json({ loginSuccess: false, message:"비밀번호가 틀렸습니다."})

            userInfo.generateToken((err, user)=>{
                if(err) return res.status(400).send(err);

                res.cookie("x_auth",user.token)
                .status(200).json({ loginSuccess: true, userId:user._id})
            })

        })
    })
})

app.get('/api/auth',auth,(req,res)=>{
    req.status(200).json({
        _id : req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth : true,
        email: req.user.email,
        name : req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    })
})

app.get('/api/logout',auth,(req,res)=>{
    // console.log("req",req.user._id)
    User.findOneAndUpdate({ _id: req.user._id},
        {token: ""},
        (err, user)=>{
            if(err) return res.json({ success:false,err});
            return res.status(200).send({ success:true})
        })
})

app.post('/api/register',(req,res)=>{

    const user = new User(req.body)

    user.save((err, userInfo)=>{
        if(err) return res.json({ success: false, err})
        return res.status(200).json({success: true})
    })
})

app.listen(port, ()=> console.log('Example app listenig on port...'))