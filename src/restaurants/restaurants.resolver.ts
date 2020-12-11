import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { CreateAccountOutput } from "src/users/dtos/create-account.dto";
import { User } from "src/users/entities/user.entity";
import { CreateRestaurantInput } from "./dtos/create-restaurant.dto";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurant.service";

@Resolver( () => Restaurant)
export class RestaurantResolver {
   constructor(private readonly retaurantService: RestaurantService){}
   
   @Mutation( returns => CreateAccountOutput)
   async createRestaurant(
      @AuthUser() authUser:User,
      @Args('input') createRestaurantInput: CreateRestaurantInput
   ): Promise<CreateAccountOutput>{
      return this.retaurantService.createRestaurant(authUser, createRestaurantInput);
   }
}