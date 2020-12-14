import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
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
    
    async getOrCreate(categoryName:string) : Promise<Category>{
        const newCategoryName = categoryName.trim().toLowerCase();
        const newCategorySlug = newCategoryName.replace(/ /g,"-");
        try{
            let category = await this.categoryRepository.findOne({categoryName:newCategorySlug});
            if(!category){
                category = await this.categoryRepository.save(this.categoryRepository.create({categoryName:newCategorySlug}));
            }
            return category;
        }catch(error){
            console.log(error);
        }
    }

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
            const restaurant = await this.restaurantRepository.findOne(editRestaurantInput.restaurantId,{loadRelationIds:true});
            console.log(`editRestaurant=${restaurant}`);
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
}