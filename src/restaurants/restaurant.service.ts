import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Restaurant } from "./entities/restaurant.entity";

@Injectable()
export class RestaurantService{
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ){}
    
    async createRestaurant(
        owner:User,
        createRestaurantInput: CreateRestaurantInput) :Promise<CreateRestaurantOutput> {
        try{
            const newRestaurant = await this.restaurantRepository.create(createRestaurantInput);
            console.log(`newRestaurant=${newRestaurant}`);
            newRestaurant.owner = owner;
            const newCategoryName = createRestaurantInput.categoryName.trim().toLowerCase();
            const newCategorySlug = newCategoryName.replace(/ /g,"-");
            let category = await this.categoryRepository.findOne({categoryName:newCategorySlug});
            console.log(`category=${category}`);
            if(!category){
                category = await this.categoryRepository.save(this.categoryRepository.create({categoryName:newCategorySlug}));
            }
            newRestaurant.category = category;
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
}