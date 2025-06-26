// ===============================================
// IMPORTS Y TIPOS NECESARIOS PARA LOS RESOLVERS
// ===============================================

// Importamos las funcionalidades de MongoDB para manejar colecciones y ObjectIds
import { Collection, ObjectId } from "mongodb";
// Importamos los tipos que definen la estructura de nuestros datos
import { Paciente,Cita } from "./types.ts";
// Importamos función de validación personalizada
import { validar } from "./utils.ts";
// Importamos GraphQLError para manejar errores de manera adecuada en GraphQL
import { GraphQLError } from "graphql";

// ===============================================
// DEFINICIÓN DEL CONTEXTO
// ===============================================

// Context: Tipo que define qué información estará disponible en todos los resolvers
// Esto permite que cada resolver tenga acceso a las colecciones de la base de datos
type Context = {
    PacientesCollection: Collection<Paciente>,  // Colección de pacientes en MongoDB
    CitasCollection: Collection<Cita>           // Colección de citas en MongoDB
}

// ===============================================
// TIPOS PARA LOS ARGUMENTOS DE MUTATIONS Y QUERIES
// ===============================================

// Argumentos que recibe la mutación para crear/actualizar pacientes
type MutationArgsPaciente = {
    id: string,         // ID del paciente (para actualizaciones)
    nombre: string,     // Nombre del paciente
    telefono: string,   // Teléfono del paciente
    correo: string      // Correo electrónico del paciente
}

// Argumentos que recibe la query para buscar un paciente específico
type QueryArgsPaciente = {
    id: string          // ID del paciente a buscar
}

// Argumentos que recibe la mutación para crear/actualizar citas
type MutationArgsCita = {
    id: string,         // ID de la cita
    Paciente: string,   // ID del paciente asociado a la cita
    fecha: string,      // Fecha de la cita
    tipo: string,       // Tipo de cita (consulta, revisión, etc.)
}

// ===============================================
// RESOLVERS PRINCIPALES
// ===============================================

// Los resolvers son funciones que definen cómo GraphQL debe resolver cada campo
// Se dividen en 4 categorías: Tipos personalizados, Query, Mutation y Subscription
export const resolvers = {

    // ===============================================
    // RESOLVERS PARA TIPOS PERSONALIZADOS
    // ===============================================
    
    // Resolver para el tipo Paciente
    // Define cómo resolver campos específicos del tipo Paciente
    Paciente: 
    {
        // Convierte el _id de MongoDB (ObjectId) a string para GraphQL
        // parent: contiene los datos del paciente desde la base de datos
        id: (parent: Paciente) => parent._id?.toString()
        
    },
    
    // Resolver para el tipo Cita
    // Define cómo resolver campos específicos del tipo Cita
    Cita:
    {
        // Convierte el _id de MongoDB (ObjectId) a string para GraphQL
        id: (parent: Cita) => parent._id?.toString(),
        
        // Resolver para el campo 'paciente' de una cita
        // Cuando se solicita el paciente de una cita, busca los datos completos del paciente
        paciente: async(
            parent: Cita,        // Los datos de la cita actual
            _: unknown,          // Argumentos (no se usan en este caso)
            context: Context     // Contexto con acceso a las colecciones
        ) => await context.PacientesCollection.findOne({_id: parent.paciente}),
        
        // Convierte la fecha de tipo Date a string para GraphQL
        fecha: (parent: Cita) => parent.fecha.toString()

    },

    // ===============================================
    // RESOLVERS PARA QUERIES (CONSULTAS)
    // ===============================================
    
    // Las queries son operaciones de solo lectura que obtienen datos
    Query: {
        
        // Query para obtener un paciente específico por su ID
        getPacient: async(
            _:unknown,                    // Root (no se usa)
            args: QueryArgsPaciente,      // Argumentos que contienen el ID del paciente
            context: Context              // Contexto con acceso a las colecciones
        ):Promise<Paciente> => {          // Retorna una promesa con los datos del paciente
            
            // Busca el paciente en la base de datos usando el ID proporcionado
            const result = await context.PacientesCollection.findOne({_id: new ObjectId(args.id)}) 
            
            // Si no encuentra el paciente, lanza un error GraphQL
            if(!result) throw new GraphQLError("Contact not found")
            
            // Retorna los datos del paciente encontrado
            return result
        },

        // Query para obtener todas las citas existentes
        getAppointments: async(
            _:unknown,              // Root (no se usa)
            __:unknown,             // Argumentos (no se usan, por eso __)
            context: Context        // Contexto con acceso a las colecciones    
        ):Promise<Cita[]> => await context.CitasCollection.find().toArray()  // Busca todas las citas y las convierte a array
       
    },
    // ===============================================
    // RESOLVERS PARA MUTATIONS (MODIFICACIONES)
    // ===============================================
    
    // Las mutations son operaciones que modifican datos (crear, actualizar, eliminar)
    Mutation: {
        
        // Mutation para crear un nuevo paciente
        addPatient: async(
            _:unknown,           // Root (no se usa)
            args: Paciente,      // Argumentos con los datos del nuevo paciente
            context: Context     // Contexto con acceso a las colecciones
        ):Promise<Paciente> => {
            
            // VALIDACIÓN: Verifica si ya existe un paciente con el mismo correo o teléfono
            const paciente_existe= await context.PacientesCollection.findOne({$or: [
                {correo: args.correo},      // Busca por correo
                {telefono: args.telefono}   // O por teléfono
            ]})
            
            // Si ya existe, lanza un error
            if(paciente_existe) throw new GraphQLError("ya existe el paciente")
                
                // INSERCIÓN: Crea el nuevo paciente en la base de datos
                const { insertedId } = await context.PacientesCollection.insertOne({
                    nombre: args.nombre,
                    telefono: args.telefono,
                    correo: args.correo,
                });
                
                // RESPUESTA: Retorna el paciente creado con su nuevo ID
                return {
                    _id: insertedId,
                    nombre: args.nombre,
                    telefono: args.telefono,
                    correo: args.correo,
                };
                
        },
        // Mutation para crear una nueva cita médica
        addAppointment: async(
            _:unknown,                                                      // Root (no se usa)
            args: { paciente: string, fecha: string, tipo: string },       // Argumentos con los datos de la cita
            context: Context                                                // Contexto con acceso a las colecciones
        ):Promise<Cita> =>{
            
            // DESESTRUCTURACIÓN: Extrae los datos de los argumentos
            const { paciente, fecha, tipo } = args

            // VALIDACIÓN: Verifica si ya existe una cita para el mismo paciente en la misma fecha
            const cita_existe=await context.CitasCollection.findOne({
                paciente: new ObjectId(paciente),  // Convierte el ID del paciente a ObjectId
                fecha: new Date(fecha)             // Convierte la fecha string a Date
            })
            
            // Si ya existe una cita, lanza un error
            if(cita_existe) throw new GraphQLError("Ya existe una cita para este paciente en esa fecha")
                
                // INSERCIÓN: Crea la nueva cita en la base de datos
                const { insertedId } = await context.CitasCollection.insertOne({
                    paciente: new ObjectId(paciente),  // Guarda la referencia al paciente
                    fecha: new Date(fecha),            // Guarda la fecha como objeto Date
                    tipo                               // Guarda el tipo de cita
                })
                
                // RESPUESTA: Retorna la cita creada con su nuevo ID
                return {
                    _id: insertedId,
                    paciente: new ObjectId(paciente),
                    fecha: new Date(fecha),
                    tipo
                }
        },
        // Mutation para eliminar una cita existente
        deleteAppointment: async(
            _:unknown,                     // Root (no se usa)
            args: { id: string },          // Argumentos que contienen el ID de la cita a eliminar
            context: Context               // Contexto con acceso a las colecciones
        ):Promise<boolean> => {
            
            // ELIMINACIÓN: Intenta eliminar la cita con el ID proporcionado
            const { deletedCount } = await context.CitasCollection.deleteOne({_id: new ObjectId(args.id)})
            
            // RESPUESTA: Retorna false si no se eliminó ningún documento, true si se eliminó
            if(deletedCount === 0) return false    // No se encontró la cita
            return true                           // Cita eliminada exitosamente
        },

        // Mutation para actualizar los datos de un paciente existente
        updatePatient: async(
            _:unknown,              // Root (no se usa)
            args: Paciente,         // Argumentos con los nuevos datos del paciente
            context: Context        // Contexto con acceso a las colecciones
        ):Promise<Paciente> => {
            
            // DESESTRUCTURACIÓN: Extrae el ID y teléfono de los argumentos
            const { _id, telefono } = args

            // VALIDACIÓN 1: Verifica que el paciente existe
            const paciente_existe= await context.PacientesCollection.findOne({_id: new ObjectId(_id)})
            if(!paciente_existe) throw new GraphQLError("Paciente no encontrado")

            // VALIDACIÓN 2: Si se proporciona un nuevo teléfono, lo valida
            if(telefono) {
                const validadotelefono  = await validar(telefono)  // Función personalizada de validación
                if (!validadotelefono){
                    throw new GraphQLError("telefono invalido")
                }
            }

            // PREPARACIÓN: Separa el ID de los campos a actualizar
            // Usamos destructuring para excluir el _id de los campos de actualización
            const { _id: _id_unused, ...updateFields } = args;
            
            // ACTUALIZACIÓN: Busca y actualiza el paciente en una sola operación
            const result = await context.PacientesCollection.findOneAndUpdate(
                {_id: new ObjectId(_id)},           // Filtro: busca por ID
                {$set:{...updateFields}},           // Actualización: solo los campos proporcionados
                {returnDocument: "after"}           // Opción: retorna el documento actualizado
            )

            // VALIDACIÓN 3: Verifica que la actualización fue exitosa
            if(!result) throw new GraphQLError("Contact not found")
            
            // RESPUESTA: Retorna el paciente actualizado
            return result
        }


    }
}