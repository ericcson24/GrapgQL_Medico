export const typeDefs = `#graphql
    type Paciente {
        id: ID!,
        nombre: String!,
        telefono: String!,
        correo: String!
        
    }

    type Cita {
        id: ID!,
        paciente: Paciente!,
        fecha: String!,
        tipo: String!
        
    }
    
    type Query {
        
        getPacient(id:String!):Paciente!
        getAppointments:[Cita!]!
    }

    type Mutation {
        addPatient(nombre:String!, telefono:String!,correo:String!):Paciente!
        addAppointment(paciente:ID!,fecha:String!, tipo:String!):Cita!
        deleteAppointment(id:ID!):Boolean!
        updatePatient(id:ID!, nombre:String, telefono:String,correo:String):Paciente!
    }
`