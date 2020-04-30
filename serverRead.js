const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
 mongoose.connection.openUri('mongodb://localhost:27017/FreeCampAus').then(() => {
    console.log('Connected to DB!');
}).catch((error) => {
    console.log("error ", error);
}); 
const Schema = mongoose.Schema;
var modelName = "Toilets";

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
  const Model = mongoose.model(modelName, schema, modelName);
var arr = [];
fs.createReadStream('./data.csv')
  .pipe(csv())
  .on('data', async (row) => {
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
    let save = new Model(obj);
    const res = await save.save();

    console.log("Saved saved ",res)
    // arr.push(obj);
  })
  .on('end', () => {
    // console.log('CSV file successfully processed', arr);
  });