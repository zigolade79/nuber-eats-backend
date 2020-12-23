import { Module, Response } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
import { RestaurantService } from './restaurant.service';
import { CategoryResolver, DishResolver, RestaurantResolver } from './restaurants.resolver';

@Module({
    imports:[TypeOrmModule.forFeature([Restaurant, CategoryRepository, Dish])],
    providers:[RestaurantResolver, RestaurantService, CategoryResolver, DishResolver]
})
export class RestaurantsModule {
  
}
