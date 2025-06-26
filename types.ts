import { ObjectId, OptionalId } from "mongodb";

//como se vera contacto
export type Paciente = OptionalId<{
    
    nombre: string;
    telefono: string;
    correo: string;
    
}>;

export type Cita = OptionalId<{
    paciente: ObjectId;
    fecha: Date;
    tipo: string;
    
}>;



//link de la api: https://api.api-ninjas.com/v1/validatephone
export type API_Phone = {
   is_valid : boolean;
   //no pide el ejercicio, pero lo quiro practicar
   is_formatted_properly : boolean;
};

