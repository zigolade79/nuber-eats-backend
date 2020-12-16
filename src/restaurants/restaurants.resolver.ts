import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User, UserRole } from "src/users/entities/user.entity";
import { AllCategoryOutput } from "./dtos/all-categories.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurant.service";

@Resolver( () => Restaurant)
export class RestaurantResolver {
   constructor(private readonly retaurantService: RestaurantService){}
   
   @Mutation( returns => CreateRestaurantOutput)
   @Role(["Owner"])
   async createRestaurant(
      @AuthUser() authUser:User,
      @Args('input') createRestaurantInput: CreateRestaurantInput
   ): Promise<CreateRestaurantOutput>{
      return this.retaurantService.createRestaurant(authUser, createRestaurantInput);
   }

   @Mutation( returns => EditRestaurantOutput)
   @Role(["Owner"])
   async editRestaurant(
      @AuthUser() authUser:User,
      @Args('input') editRestaurantInput: EditRestaurantInput
   ): Promise<EditRestaurantOutput>{
      return this.retaurantService.editRestaurant(authUser, editRestaurantInput);
   }

   @Mutation( returns => DeleteRestaurantOutput)
   @Role(["Owner"])
   async deleteRestaurant(
      @AuthUser() owner:User,
      @Args('input') deleteRestaurantInput: DeleteRestaurantInput
   ): Promise<DeleteRestaurantOutput>{
      return this.retaurantService.deleteRestaurant(owner, deleteRestaurantInput);
   }
}

@Resolver( of => Category)
export class CategoryResolver{
   constructor(private readonly restaurantService:RestaurantService){}

   @ResolveField(type=>Int)
   restaurantCount(@Parent() category:Category):Promise<number>{
      console.log(category);
      return this.restaurantService.countRestaurant(category);
   }

   @Query(type=>AllCategoryOutput)
   allCategories():Promise<AllCategoryOutput>{
      return this.restaurantService.allCategories();
   }

}