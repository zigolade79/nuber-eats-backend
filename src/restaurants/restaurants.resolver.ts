import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { type } from "os";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User, UserRole } from "src/users/entities/user.entity";
import { AllCategoryOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurants.dto";
import { SearchRestaurantInput, SearchResturantOutput } from "./dtos/search-restaurant.dto";
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

   @Query(returns=>RestaurantsOutput)
   restaurants(@Args('input') restaurantsInput:RestaurantsInput):Promise<RestaurantsOutput>{
      return this.retaurantService.allRestaurants(restaurantsInput);

   }

   @Query(returns=>RestaurantOutput)
   restaurant(@Args('input') restaurantInput:RestaurantInput):Promise<RestaurantOutput>{
      return this.retaurantService.findRestaurantById(restaurantInput);
   }

   @Query(returns=>SearchResturantOutput)
   searchRestaurant(@Args('input') searchRestaurantInput:SearchRestaurantInput):Promise<SearchResturantOutput>{
      return this.retaurantService.searchRestaurantByName(searchRestaurantInput);
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

   @Query(type=>CategoryOutput)
   category(@Args('input') categoryInput: CategoryInput):Promise<CategoryOutput>{
      return this.restaurantService.findCategoryBySlug(categoryInput);
   }

}