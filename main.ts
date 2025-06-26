import { MongoClient } from 'mongodb';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { typeDefs } from "./typeDefs.ts";
import { resolvers } from "./resolvers.ts";
import { GraphQLError } from "graphql";
import { Cita, Paciente } from "./types.ts";
import { Collection } from "mongodb";

// Definir el tipo de contexto
type Context = {
    PacientesCollection: Collection<Paciente>,
    CitasCollection: Collection<Cita>
}

//Conectarse a la base de datos
const MONGO_URL = Deno.env.get("MONGO_URL")
if(!MONGO_URL) throw new GraphQLError("MONGO URL NOT EXISTS")
//enlace cogido
const client = new MongoClient(MONGO_URL)
await client.connect()
console.log("Conectado a la base de datos")

//colecciones en base de datos
const db = client.db("medico")
const PacientesCollection = db.collection<Paciente>("pacientes")
const CitasCollection = db.collection<Cita>("citas")

//para la creacion de server apollo
const server = new ApolloServer<Context>({typeDefs, resolvers})
const { url } = await startStandaloneServer(server,{
  context: (): Promise<Context> => Promise.resolve({ PacientesCollection, CitasCollection })             //aqui creamos apollo con esta coleccion
})

console.log(`🚀  Server ready at: ${url}`);