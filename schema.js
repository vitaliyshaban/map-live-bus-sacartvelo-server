const {gql} = require('apollo-server')
const GraphQLJSON = require('graphql-type-json');

const schema = gql`
	scalar JSON

	type Bus  {
		id: ID!
		busid: String
		number: String
		descr: String
		data: Data
	}

	type Data {
		coordinates: [[Float]]
		busStops: BusStops
		buses: Buses
	}
	
	type Buses {
		c: Int
		id: String
		lat: Float
		lon: Float
		name: String
        s: Int
	}

	type BusStops {
		location: [String]
		name: String
		output: JSON
		stop_id: String!
	}


	type Query {
		getAllBuses: [Bus]!
		getBus(id: ID!): Bus!
	}
	
	input BusInput {
		busid: String
		number: String
		descr: String
	}

	input BuseseDataInput {
		data: JSON
	}

	type Mutation {
		createBus(id: ID!, busid: String, number: String, descr: String): Bus!
		updateBus(id: ID!, input: BusInput): Bus
		updateAllDataBuses(id: ID!, input: BuseseDataInput): Data
	}
	type Subscription {
		busCreated: Bus,
		busUpdate: Bus,
		busesUpdate: Data
	}
`;

const resolvers = {
  JSON: GraphQLJSON
};

module.exports = schema

