import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { boolean } from "joi";
import { Repository } from "typeorm";
import { CreateRestaurantDto } from "./dtos/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dtos/update-restaurant.dto";
import { Restaurant } from "./entities/restaurant.entity";

@Injectable()
export class RestaurantService{
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>
    ){}
    
    createRestaurant(input: CreateRestaurantDto) :Promise<Restaurant> {
        const newRestaurant = this.restaurantRepository.create(input);
        return this.restaurantRepository.save(newRestaurant);
    }
}