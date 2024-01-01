import { Pokemon } from './../pokemon/entities/pokemon.entity';
import { Injectable } from '@nestjs/common';
//import axios, { AxiosInstance } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapters';

@Injectable()
export class SeedService {

  //private readonly axios: AxiosInstance = axios;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter,
  ){}
  
  async executeSeed() {

    await this.pokemonModel.deleteMany();

    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=1000');

    const pokemonToInsert: {name:string, no: number}[] = [];

    //const insertPromisesArray = [];

    data.results.forEach(({name,url}) => {
      const segments = url.split('/');
      const no = +segments[segments.length - 2];

      //const pokemon = await this.pokemonModel.create({name, no});
      // insertPromisesArray.push(
      //   this.pokemonModel.create({name, no})
      // );

      pokemonToInsert.push({name,no});
    });

//    await Promise.all(insertPromisesArray);

    await this.pokemonModel.insertMany(pokemonToInsert)

    return "Inserción correcta";
  }
}
