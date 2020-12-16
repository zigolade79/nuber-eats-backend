import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { AllCategoryOutput } from "./dtos/all-categories.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";

@Injectable()
export class RestaurantService{
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>,
        private readonly categoryRepository: CategoryRepository,
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
}