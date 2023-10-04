const express = require('express');
const graphqlHTTP = require('express-graphql').graphqlHTTP;

const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');

const schema = require('./schema');
const buses = require('./buses');


const baseURL = 'http://transport.geogps.ge/get-live-bus-stop-time';

console.log(buses)


const root = {
  getAllBuses: () => {
    return buses;
  },
  getBus: ({id}) => {
    return buses.find(bus => bus.id == id)
  }
};


const app = express();

app.use(cors());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => res.send('GraphQL Server is running'))

app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
  })
);



// cron.schedule('*/8 * * * * *', () => {
//   console.log('start update ...')
//   getDataRoutes().then(()=> {
//     // busJson = buses;
//     console.log('end update.')
//   });
// });


getDataRoutes().then(()=> {
  setInterval(() => {
    buses[0].number = Math.floor(Math.random() * 100);
    console.log(buses[0].number)
    
  }, 1000)
});



async function getDataRoutes() {
  await Promise.all(buses.map(async (bus) => {
      let routeDate = await axios({
        method: 'post',
          url: `http://transport.geogps.ge/get-live-bus-stop-time`,
          params: {
            routeId: bus.busid
          },
        headers: { "Content-Type": "application/json" }
      });
      // console.log(routeDate)
      bus.data = routeDate.data;
  }));
}


const port = 9000
app.listen(port, () => {
  console.log(`Example app listening at: ${port}`)
})
