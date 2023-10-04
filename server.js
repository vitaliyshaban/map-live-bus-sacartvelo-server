const { ApolloServer } = require('apollo-server-express');
const { createServer }  = require('http');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { ApolloServerPluginDrainHttpServer } =  require("apollo-server-core");
const { WebSocketServer }  = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { makeExecutableSchema }  = require('@graphql-tools/schema');
const { PubSub }  = require('graphql-subscriptions');

const pubsub = new PubSub();

const axios = require('axios');

const typeDefs = require('./schema');
const buses = require('./buses');

// class Bus {
//   constructor(id, input) {
//     this.id = id;
//     for(let key in input) {
//       this[key] = input[key];
//     }
//   }
//   get json() {
//     const keys = {}
//     for(let key in this) {
//       keys[key] = this[key]
//     }
//     return keys
//   }
// }


const resolvers = {
  Query: {
	  getAllBuses: () =>  {
      console.log('return all buses')
      return buses
    },
	  getBus: (_, { id }) => {
      console.log('getRout')
      return buses.find(bus => bus.id == id)
    }
  },
  Subscription: {
    busCreated: {
      subscribe: () => pubsub.asyncIterator(['BUS_CREATED']),
    },
    busUpdate: {
      subscribe: () => pubsub.asyncIterator(['BUS_UPDATE']),
    },
    busesUpdate: {
      subscribe: function () {
        console.log('update')
        return pubsub.asyncIterator(['BUSES_UPDATE'])
      },
    }
  },
  Mutation: {
    async updateAllDataBuses(_, {id, data}) {
      buses[id] = {...buses[id], data};
      pubsub.publish('BUSES_UPDATE', { 
        busesUpdate: {...buses[id], data}
      });
      console.log(buses[id])
      return data
    },
    async createBus(_, {busid, number, descr, id}) {
      // var id = require('crypto').randomBytes(10).toString('hex');
      buses.push({
        id: id,
        busid: busid,
        number: number,
        descr: descr
      });
      pubsub.publish('BUS_CREATED', { 
        busCreated: {
          id: id,
          busid: busid,
          number: number,
          descr: descr
        } 
      }); 
      return {
        id: id,
        busid: busid,
        number: number,
        descr: descr
      };
    },
    updateBus: (_, {id, input}) => {
      if (!buses[id]) {
        throw new Error('no Bus exists with id ' + id);
      }
      buses[id] = {...buses[id], ...input}
      pubsub.publish('BUS_UPDATE', {
        busUpdate: {id, ...input}
      });
      return {id, ...input}
    },
  },
};


const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
// app.use(cors());

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

const httpServer = createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});


startApolloServer();

async function startApolloServer() {
  await server.start();
  server.applyMiddleware({
    app,
    cors: true
  });
  
  const PORT = 4001;
  httpServer.listen(PORT, () => {
    console.log(
      `Server is now running on http://localhost:${PORT}${server.graphqlPath}`,
    );
  });
}

  cron.schedule('*/8 * * * * *', () => {
    // console.log('start update ...')
    getDataRoutes().then(()=> {
      // busJson = buses;
      // console.log('end update.')
    });
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
      
      resolvers.Mutation.updateAllDataBuses(0, {id: bus.id, data: routeDate.data})
  }));
}
