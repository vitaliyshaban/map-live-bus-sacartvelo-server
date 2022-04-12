const express = require('express')

const cors = require('cors');
// const fetch = require('node-fetch');
const axios = require('axios');
const cron = require('node-cron');
const app = express();

app.use(cors());
// var liveStreamRadio = require('lsr-wrapper');

// var myRadio = new liveStreamRadio("http", "127.0.0.1", "8000", "1234-5678-9012-3456");


// app.use(cors({
//   origin: 'http://192.168.1.77'
// }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.get('/', (req, res) => {
  res.json({});
})

let busJson = [];

app.get('/getBuses', function(req, res) {
	res.json(busJson);
});



cron.schedule('*/5 * * * * *', () => {
	// console.log('5s');
	getPositionBus("5ed608b7340f60873ff9e1c0").then((result) => {
		busJson = result.data;
	})
});

async function getPositionBus(id) {
  try {
  	// console.log(region)
    return await axios( 
    	{
			method: 'post',
		    url: `http://transport.geogps.ge/get-live-bus-stop-time`,
    		params: {
    			routeId: id
    		},
			headers: { "Content-Type": "application/json" }
    	}
    );
  } catch (error) {
    console.error(error);
  }
}


const port = 9000
app.listen(port, () => {
  console.log(`Example app listening at: ${port}`)
})
