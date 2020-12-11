import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CreateRestaurantDto } from "./dtos/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dtos/update-restaurant.dto";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurant.service";

@Resolver( () => Restaurant)
export class RestaurantResolver {
   constructor(private readonly retaurantService: RestaurantService){}
   
   @Mutation( returns => Boolean)
   async createRestaurant(
      @Args('input') input: CreateRestaurantDto
   ): Promise<Boolean>{
      try{
         await this.retaurantService.createRestaurant(input);
         return true;
      }catch(e)
      {
         console.log(e);
         return false;
      }
      
   }

}