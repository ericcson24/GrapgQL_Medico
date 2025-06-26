import { GraphQLError } from "graphql"
import { API_Phone } from "./types.ts";

export const validar=async(telefono:string)=>{
    //se pone por lo de que da error
    const API_KEY = Deno.env.get("API_KEY")
    if(!API_KEY) throw new GraphQLError("API_KEY not found")

    

    //como se hace: en la pagina te dan esto: https://api.api-ninjas.com/v1/validatephone?number=+12065550100
    // se cambia el final al parametro que traes, es decir: https://api.api-ninjas.com/v1/validatephone?number=${phone}  siendo ${phone} lo nuevo
    //se ponen las comillas ``

    const url_validar= `https://api.api-ninjas.com/v1/validatephone?number=${telefono}`

    //obiamente, solo queremos unas cosas, asiq aqui cogemos lo que nos interesa: 
    const datos = await fetch(url_validar,{
        //cogemos de la pagina, del cuadradito negro, copiamos el header, cambiamos la api que hay aki por api_key
        headers: {
            'X-Api-Key': API_KEY
          },
    })
    //error:
    if(datos.status !== 200) throw new GraphQLError("Error in the API")
    
    //resultado
    const result:API_Phone = await datos.json()

    //ahora, si el resultado no es "is valid" mostramos
    if(!result.is_valid) throw new GraphQLError("no existe el telefono")
        return {
            is_valid: result.is_valid,
            is_formatted_properly: result.is_formatted_properly
        }


}
