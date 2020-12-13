import { SetMetadata } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { CreateAccountOutput } from "src/users/dtos/create-account.dto";
import { User, UserRole } from "src/users/entities/user.entity";
import { CreateRestaurantInput } from "./dtos/create-restaurant.dto";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurant.service";

@Resolver( () => Restaurant)
export class RestaurantResolver {
   constructor(private readonly retaurantService: RestaurantService){}
   
   @Mutation( returns => CreateAccountOutput)
   @Role(["Owner"])
   async createRestaurant(
      @AuthUser() authUser:User,
      @Args('input') createRestaurantInput: CreateRestaurantInput
   ): Promise<CreateAccountOutput>{
      return this.retaurantService.createRestaurant(authUser, createRestaurantInput);
   }
}