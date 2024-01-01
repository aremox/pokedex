import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PokemonService {

  private defaultLimit = this.configService.getOrThrow<number>('default_limit');

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService
  ){}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create( createPokemonDto);
      return pokemon;   
    } catch (error) {
      this.handleExceptions(error);
    }


  }

  async findAll(paginationDto:PaginationDto) {
    let pokemon: Pokemon[];
    
    const {limit = this.defaultLimit, offset = 0} = paginationDto;
    pokemon = await this.pokemonModel.find()
              .limit(limit)
              .skip(offset)
              .sort({
                no: 1
              })
              .select('-__v');
    return pokemon;
  }

  async findOne(term: string) {
    let pokemon: Pokemon;
    if ( !isNaN(+term)){
      pokemon = await this.pokemonModel.findOne({no: term});
    }

    // MongoID
    if ( !pokemon && isValidObjectId(term)){
      pokemon = await this.pokemonModel.findById(term);
    }

    //Name
    if (!pokemon){
      pokemon = await this.pokemonModel.findOne({ name: term.toLocaleLowerCase().trim()});
    }

    if (!pokemon) throw new NotFoundException(`Pokemon no encontrado.`)



   return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    
    const pokemon = await this.findOne(term);

    if ( updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
    
    try {
      await pokemon.updateOne(updatePokemonDto);
      return {...pokemon.toJSON(),...updatePokemonDto};  

    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id);
    // await pokemon.deleteOne();
    const {deletedCount} = await this.pokemonModel.deleteOne({_id: id})
    if(deletedCount === 0){
      throw new BadRequestException(`Id no encontrado`);
    }
    return `Pokemon con id ${id} ha sido eliminado`;
  }

  private handleExceptions( error: any ){
    if(error.code === 11000){
      throw new BadGatewayException(`Entidad duplicada: ${JSON.stringify(error.keyValue)}`);
    }
    console.error(error)
    throw new InternalServerErrorException(`No se pudo crear el Pokemon - Revisar log del servidor`)
  }
}
