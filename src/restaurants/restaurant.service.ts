import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Like, Raw, Repository } from "typeorm";
import { AllCategoryOutput } from "./dtos/all-categories.dto";
import { CategoryInput } from "./dtos/category.dto";
import { CreateDishInput, CreateDishOutput } from "./dtos/create-dish.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteDishInput, DeleteDishOutput } from "./dtos/delete-dish.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditDishInput, EditDishOutput } from "./dtos/edit-dish.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import { RestaurantsInput } from "./dtos/restaurants.dto";
import { SearchRestaurantInput, SearchResturantOutput } from "./dtos/search-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Dish } from "./entities/dish.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";

@Injectable()
export class RestaurantService{
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>,
        private readonly categoryRepository: CategoryRepository,
        @InjectRepository(Dish)
        private readonly dishRepository: Repository<Dish>,
    ){}
    
    async createRestaurant(
        owner:User,
        createRestaurantInput: CreateRestaurantInput) :Promise<CreateRestaurantOutput> {
        try{
            const newRestaurant = await this.restaurantRepository.create(createRestaurantInput);
            console.log(`newRestaurant=${newRestaurant}`);
            newRestaurant.owner = owner;
            newRestaurant.category = await this.categoryRepository.getOrCreate(createRestaurantInput.categoryName);
            await this.restaurantRepository.save(newRestaurant);
            return {
                ok:true,
            };
        }catch(error){
            return {
                ok:false,
                error
             };
        }
    }
    async editRestaurant(
        owner:User,
        editRestaurantInput: EditRestaurantInput) :Promise<EditRestaurantOutput> {
        try{
            const result = this.checkRestaurant(owner, editRestaurantInput.restaurantId);
            if((await result).ok === false){
                return result;
            }
            let category:Category;
            if(editRestaurantInput.categoryName){
                category = await this.categoryRepository.getOrCreate(editRestaurantInput.categoryName);
            }
            await this.restaurantRepository.save([{
                id:editRestaurantInput.restaurantId,
                ...editRestaurantInput,
                ...(category && {category}),
            }]);
            return {
                ok:true,
            };
        }catch(error){
            return {
                ok:false,
                error
             };
        }
      
    }

    async deleteRestaurant(owner:User, deleteRestaurantInput: DeleteRestaurantInput): Promise<DeleteRestaurantOutput>{
        try{
            const result = this.checkRestaurant(owner, deleteRestaurantInput.restaurantId);
            if((await result).ok === false){
                return result;
            }
            await this.restaurantRepository.delete(deleteRestaurantInput.restaurantId);
            return{
                ok:true,
            }
        }catch(error){
            return{
                ok:false,
                error,
            }
        }
    }

    async checkRestaurant(owner:User, restaurantId:number):Promise<DeleteRestaurantOutput>{
        try{
            const restaurant = await this.restaurantRepository.findOne(restaurantId,{loadRelationIds:true});
            console.log(`checkRestaurant=${restaurant}`);
            if(!restaurant){
                return{
                    ok:false,
                    error:"The restaurant not found",
                }
            }
            if(owner.id !== restaurant.ownerId){
                return{
                    ok:false,
                    error:"You can not edit restaurant that you don't own",
                }
            }
            return{
                ok:true,
            }
        }catch(error){
            console.log(error);
            return{
                ok:false,
                error,
            }
        }
    }

    async allCategories():Promise<AllCategoryOutput>{
        try{
            const categories = await this.categoryRepository.find();
            return{
                ok:true,
                categories,
            }
        }catch(error){
            return{
                ok:false,
                error,
            }

        };
    }

    countRestaurant(category:Category){
        return this.restaurantRepository.count({category});
    }

    async findCategoryBySlug({slug, page}: CategoryInput){
        try{
            const category = await this.categoryRepository.findOne({categoryName:slug});
            if(!category){
                return{
                    ok:false,
                    error: "Could not find category",
                }
            }
            const restaurants = await this.restaurantRepository.find({
                where:{
                    category,
                },
                order:{
                    isPromoted:"DESC",
                },
                take:5,
                skip: (page -1) *5,
            });
            const totalResults = await this.countRestaurant(category);
            return{
                ok:true,
                category,
                restaurants,
                totalPages: Math.ceil(totalResults/5),
            }
        }catch(error){
            return{
                ok: false,
                error:"Could not load category",
            }
        }
    }

    async allRestaurants({page}: RestaurantsInput){
        try{
            const [restaurants,totalResults] = await this.restaurantRepository.findAndCount({
                take:5,
                skip: (page -1) *5,
                relations:['category'],
                order:{
                    isPromoted:"DESC",
                }
            });
            return{
                ok:true,
                restaurants,
                totalPages: Math.ceil(totalResults/5),
                totalResults,
            }
        }catch(error){
            return{
                ok: false,
                error:"Could not load Restaurants",
            }
        }
    }

    async findRestaurantById({restaurantId}:RestaurantInput):Promise<RestaurantOutput>{
        try{
            const restaurant= await this.restaurantRepository.findOne(restaurantId,{relations:["menu"]});
            if(!restaurant){
                return{
                    ok:false,
                    error: "Restaurant not found"
                }
            }
            return{
                ok:true,
                restaurant,
            }
        }catch(error){
            return{
                ok: false,
                error:"Could not find restaurant",
            }
        }
    }

    async searchRestaurantByName({qeury,page}:SearchRestaurantInput):Promise<SearchResturantOutput>{
        try{
            console.log(qeury, page);
            const [restaurants, totalResults] = await this.restaurantRepository.findAndCount({
                where:{
                    restaurantName:Raw(restaurantName=>`${restaurantName} ILIKE '%${qeury}%'`),
                },
                skip: (page -1) *5,
                take: 5,
                relations:['category']
            });
            if(!restaurants){
                return{
                    ok:false,
                    error: "Restaurant not found"
                }
            }
            return{
                ok:true,
                restaurants,
                totalResults,
                totalPages: Math.ceil(totalResults/5),
            }
        }catch(error){
            console.log(error);
            return{
                ok: false,
                error:"Could not search for restaurants",
            }
        }
    }

    async createDish(owner:User, createDishinput:CreateDishInput) : Promise<CreateDishOutput>{
        try{
            const restaurant = await this.restaurantRepository.findOne(createDishinput.restaurantId);
            if(!restaurant){
                return{
                    ok:false,
                    error:"Cannot find the restaurant"
                }
            }
            if(restaurant.ownerId !== owner.id){
                return{
                    ok:false,
                    error:"You are not the restaurant's owner"
                }
            }
            const dish = await this.dishRepository.save(this.dishRepository.create({...createDishinput, restaurant}));
            console.log(dish);
            return{
                ok:true
            }
        }catch(error){
            console.log(error);
            return{
                ok:false,
                error:"Cannot Create Dish"
            }
        }
    }

    async checkDish(owner:User, dishId:number) : Promise<EditDishOutput>{
        try{
            const dish = await this.dishRepository.findOne(dishId,{relations:['restaurant']});
            if(!dish){
                return{
                    ok:false,
                    error:"Cannot find the dish"
                }
            }
            if(dish.restaurant.ownerId !== owner.id){
                return{
                    ok:false,
                    error:"You are not the restaurant's owner"
                }
            }
            return{
                ok:true
            }
        }catch(error){
            console.log(error);
            return {
                ok:false,
                error
            }
        }
    }

    async editDish(owner:User, editDish:EditDishInput) : Promise<EditDishOutput>{
        try{
            const result = await this.checkDish(owner, editDish.dishId);
            if(result.ok === false){
                return result;
            }
            await this.dishRepository.save([
                {
                    id:editDish.dishId,
                    ...editDish,
                }
            ]);
            return{
                ok:true
            }
        }catch(error){
            console.log(error);
            return{
                ok:false,
                error:"Cannot edit Dish"
            }
        }
    }

    async deleteDish(owner:User, {dishId}:DeleteDishInput) : Promise<DeleteDishOutput>{
        try{
            const result = await this.checkDish(owner, dishId);
            if(result.ok === false){
                return result;
            }
            await this.dishRepository.delete(dishId);
            return{
                ok:true
            }
        }catch(error){
            console.log(error);
            return{
                ok:false,
                error:"Cannot delete Dish"
            }
        }
    }
}