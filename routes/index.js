var routes = require('express').Router();
var bcrypt = require('bcryptjs');
var MongoClient=require('mongodb').MongoClient;
var bodyparser=require('body-parser');
var urlencoded=bodyparser.urlencoded({extended:true});
var multer = require('multer');
var path = require('path');
var appDir = path.dirname(require.main.filename);
var fs = require('fs')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
 
var upload = multer({ storage: storage })

routes.get('/', (req, res) => {
    res.sendFile(appDir+"/index.html");
});

routes.get('/signuppage', (req, res) => {
    res.sendFile(appDir+"/signup.html");
});

routes.get('/loginpage', (req, res) => {
    res.sendFile(appDir+"/login.html");
});

routes.get('/postview', (req, res) => {
    var a = req.query.email;
    var b = req.query.name;
    res.render("postview",{p:0,name:b,email:a});
});

routes.get('/hashtags', (req, res) => {
    MongoClient.connect('mongodb+srv://harsha:harsha@harsha1-ashl9.mongodb.net/test?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('amihack');
        var hashtags = [];
        db.collection('posts').find().toArray(function(err,result){
            for(var i=0;i<result.length;i++){
                var thash = result[i].hashtags;
                for(var j=0;j<thash.length;j++){
                    if(!hashtags.includes(thash[j])){
                        hashtags.push(thash[j]);
                    }
                }
            }
            res.render("hashtags",{hashtags:hashtags});
        })
    })
    // res.render("hashtags");
});

routes.post('/signup',urlencoded,function(req,res){
    var a=req.body.fname;
    var aa=req.body.lname;
    a = a+" "+aa;
    var b=req.body.email;
    var c=req.body.mobile;
    var e=req.body.password;
    console.log(a);
    bcrypt.hash(e, 10, function(err, hash) {
        var newpwd = hash;
        details={
            name:a,email:b,mobile:c,passwd:newpwd,profile:"",hashtags:[],skills:[],bio:""
        };
            MongoClient.connect('mongodb+srv://harsha:harsha@harsha1-ashl9.mongodb.net/test?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
            if(err) throw err;
            var db=db.db('amihack');
            query={email:b};
                db.collection('users').find(query).toArray(function(err,result){
                    if(result[0]){
                        res.send("UserAlreadyExists");
                    }
                    else{
                        db.collection('users').insertOne(details,function(err,result){
                        if(err) throw err;
                         var hashtags = [];
                        db.collection('posts').find().toArray(function(err,result){
                            for(var i=0;i<result.length;i++){
                                var thash = result[i].hashtags;
                                for(var j=0;j<thash.length;j++){
                                    if(!hashtags.includes(thash[j])){
                                        hashtags.push(thash[j]);
                                    }
                                }
                            }
                            res.render("hashtags",{hashtags:hashtags,details:details});
                        })
                    });
                }
            });
        });
    });
})

routes.post('/login',urlencoded,function(req,res){
        var a=req.body.email;
        var b=req.body.password;
        var q = {email:a};
        MongoClient.connect('mongodb+srv://harsha:harsha@harsha1-ashl9.mongodb.net/test?retryWrites=true&w=majority',function(err,db){
                if(err) throw err;
                var db=db.db('amihack');
            db.collection("users").findOne(q, function(err, result) {
                if(result){
                    var hash = result.passwd;
                    bcrypt.compare(b, hash, function(err, res1) {
                        if(res1) {
                                var hashtags = result.hashtags;
                                var email = result.email;
                                var name = result.name;
                                var posts = [];
                                var flags = [];
                                    db.collection('posts').find().toArray(function(err,result){
                                        for(var i=0;i<result.length;i++){
                                            if(hashtags.filter(value => result[i].hashtags.includes(value)).length == 0){
                                                console.log(hashtags.filter(value => result[i].hashtags.includes(value)).length);
                                                flags.push(0);
                                            }
                                            else{
                                                flags.push(1);
                                            }
                                        }
                                        var c = -1;
                                        for(i=0;i<flags.length;i++){
                                            if(flags[i] == 1){
                                                c++;
                                                posts.push(result[i]);
                                            }
                                        }
                                        res.render("home",{posts:posts,email:email,name:name});
                                    })
                        }
                        else {
                            res.send("IncorrectPassword");
                        } 
                    }); 
                }
                else{
                    res.send("NotRegistered");
                }
        });
    });
})

routes.post('/postdb',upload.single('myImage'),urlencoded,function(req,res){
    var img = fs.readFileSync(req.file.path);
    var caption = req.body.caption;
    var user = req.body.user;
    var name = req.body.username;
    console.log(user);
    var hashtags = caption.split("#");   
    fs.unlink(req.file.path, (err) => {
        if (err) throw err;
    });
    hashtags.shift();
    var base = new Buffer(img).toString('base64');
    var source = `data:image/png;base64,${base}`;
    MongoClient.connect('mongodb+srv://harsha:harsha@harsha1-ashl9.mongodb.net/test?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('amihack');
        var postdata = {
            src:source,
            caption:caption,
            user:user,
            username:name,
            likes:0,
            comments:[],
            hashtags:hashtags
        }
        db.collection('posts').insertOne(postdata,function(err,result){
            if(err) throw err;
            // res.render("post",{src:source,caption:caption,user:user});
            res.render("postview",{p:1,name:name,email:user});
        });
    })
})

routes.get('/home',function(req,res){
    var hashtags = ["webdevelopment","technology","ai","creativity","flutter"];
    var posts = [];
    var flags = [];
    MongoClient.connect('mongodb+srv://harsha:harsha@harsha1-ashl9.mongodb.net/test?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('amihack');
        db.collection('posts').find().toArray(function(err,result){
            for(var i=0;i<result.length;i++){
                if(hashtags.filter(value => result[i].hashtags.includes(value)).length == 0){
                    console.log(hashtags.filter(value => result[i].hashtags.includes(value)).length);
                    flags.push(0);
                }
                else{
                    flags.push(1);
                }
            }
            var c = -1;
            for(i=0;i<flags.length;i++){
                if(flags[i] == 1){
                    c++;
                    posts.push(result[i]);
                }
            }
            res.render("home",{posts:posts});
        })
    })
})

routes.post('/inserthash',urlencoded,function(req,res){
    var a = req.body.hashes;
    var b = req.body.user;
    var c = req.body.name;
    a = a.split(",");
    MongoClient.connect('mongodb+srv://harsha:harsha@harsha1-ashl9.mongodb.net/test?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
    if(err) throw err;
    var db=db.db('amihack');
        db.collection('users').update(
    {email: b },
        { $set:
            {
                hashtags: a,
            }
        }
        )
        var hashtags = a;
        var email = b;
        var name = c;
        var posts = [];
        var flags = [];
                db.collection('posts').find().toArray(function(err,result){
                for(var i=0;i<result.length;i++){
                                            if(hashtags.filter(value => result[i].hashtags.includes(value)).length == 0){
                                                console.log(hashtags.filter(value => result[i].hashtags.includes(value)).length);
                                                flags.push(0);
                                            }
                                            else{
                                                flags.push(1);
                                            }
                                        }
                                        var c = -1;
                                        for(i=0;i<flags.length;i++){
                                            if(flags[i] == 1){
                                                c++;
                                                posts.push(result[i]);
                                            }
                                        }
            res.render("home",{posts:posts,email:email,name:name});
        })
    })
})

routes.get('/profile',urlencoded,function(req,res){
    var user = req.query.email;
    var q = {email:user};
    MongoClient.connect('mongodb+srv://harsha:harsha@harsha1-ashl9.mongodb.net/test?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('amihack');
        db.collection("users").findOne(q, function(err, result) {
            res.render('profileview',{details:result});
        })
    })
})

module.exports = routes;