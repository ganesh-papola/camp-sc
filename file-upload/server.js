var formidable = require('formidable');
var fs = require('fs');
var csv = require('csv-parser');
var bodyParser = require('body-parser')
var mongoose = require('mongoose');
var express = require('express');
var http = require('http');
var app = express();


var dir = './uploads';

if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
		fs.chmod(dir, '755', function(){
			console.log("folder created");
		})
}
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json())

var server = http.createServer(app);
mongoose.Promise = global.Promise;
 mongoose.connect('mongodb://localhost:27017/FreeCampAus', { useNewUrlParser: true, useUnifiedTopology: true } ).then(() => {
    console.log('Connected to DB!');
}).catch((error) => {
    console.log("error ", error);
}); 
const Schema = mongoose.Schema;
const schema = new Schema({
	placeName: {
		type: String
	},
	address:{
		type: String,
		
	},
	country: {
		type: String,
		
	},
	contact: {
		type: String,
		
	},
	created: {
		type: Date,
		default: Date.now
	},
	Campimages1:{
		type: String,
	},
	Campimages2:{
		type: String,
	},
	Campimages3:{
		type: String,
	},
			icon:{
					type:String,
			},
			rating:{
					type:Number
			},
			latitude:{
					type:String
			},
			longitude:{
					type:String
	},
	facilities:{
					type:Array
	},
	
		isDeleted:{
			type: Boolean,
			default:false
	},
	description:{
		type:String
	},
	distance: {
		type:String
	}
});
var schemas = {
 "Attractions" :	mongoose.model("Attractions", schema, "Attractions"),
 "Campsites" :	mongoose.model("Campsites", schema, "Campsites"),
 "Picnic" :	mongoose.model("Picnic", schema, "Picnic"),
 "paidCampsites" :	mongoose.model("paidCampsites", schema, "paidCampsites"),
 "paidAttractions" :	mongoose.model("paidAttractions", schema, "paidAttractions"),
 "Showers" :	mongoose.model("Showers", schema, "Showers"),
 "Toilets" :	mongoose.model("Toilets", schema, "Toilets"),
}
var io = require('socket.io')(server);
var socket = null;
io.on('connection', function (_socket) {
	socket = _socket.join('sessionId');
});
var types = ["Attractions", "Campsites", "Picnic", "paidCampsites", "paidAttractions", "Showers", "Toilets"  ]
server.listen(3693, function() {
	console.log('listening on port 3693');	
});

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
})
var handleMongo = function(fileName, Type, cb){
	console.log("filename ", fileName,Type);
	if (!fileName || !Type){
		return cb("failed")
	}
	const Model = defineShema(Type);
	fs.createReadStream(fileName)
  .pipe(csv())
  .on('data', (row) => {
    var fac = [];
    var obj = {
      placeName : row.Name,
      "address": `${row.Address1}${row.Town?", "+row.Town:""}${row.State?", "+row.State:""}${row.Postcode?", "+row.Postcode:""}`,
      "country": "Australia",
      "contact": "",
      "facilities": [row.DrinkingWater==="TRUE"?"Water":"",row.DumpPoint==="TRUE"?"Dumping point":"","Toilets",row.Showers==="TRUE"?"Shower":""].filter(fil=>fil),
      "rating": 3,
      "latitude": row.Latitude,
      "longitude": row.Longitude,
      "description": "",
      "icon": row.IconURL,
      "Campimages1" : "",
      "Campimages2" : "",
      "Campimages3" : ""
    }
    var save = new Model(obj);
     save.save().then(res=>{
      console.log("Saved saved ",res)
    });

  })
  .on('end', () => {
    cb("success")
	})
	.on('error', () => {
    cb("failed")
  })
	
}
app.post('/delete', function(req,res){
	if(types.indexOf(req.body.type)>-1){
		var Coll = defineShema(req.body.type);
		Coll.deleteMany({},function(err,data){
			if(err)
			return res.send("delete error");
			else
			return res.send("delete success");
		})
		}else res.send("failed")
})
app.post('/', function(req, res) {
	var type= "";
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.parse(req);

	form.on('progress', function(br, be) {
		var per = (br * 100) / be;
		// if(socket)
		// socket.to('sessionId').emit('uploadProgress', { percent: per });
	})
	form.on("field", function(name, field){
		type = field;
	})
	form.on('file', function(name, file) {
		var rstream = fs.createReadStream(file.path);
		var wstream = fs.createWriteStream(__dirname + '/uploads/' + file.name);
		rstream.pipe(wstream);
		wstream.on('finish', function() {
			var filePath = `./uploads/${file.name}`;
			if(types.indexOf(type)>-1)
			handleMongo(filePath, type, function(status){
				fs.unlinkSync(filePath);
				if(socket)
				socket.emit('finished_123k#870989877w7&4red#$976', status );
				if(status==="success")
					res.send('success');
					else res.send("failed")
			})
			else {
				fs.unlinkSync(filePath);
				res.send('collection not found');
			}
			// 
		})
	})
})
var defineShema = function(Type){
	return schemas[Type]
}