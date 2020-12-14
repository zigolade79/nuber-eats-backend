import {EntityRepository, Repository} from "typeorm";
import { Category } from "../entities/category.entity";

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {

    async getOrCreate(categoryName:string) : Promise<Category>{
        const newCategoryName = categoryName.trim().toLowerCase();
        const newCategorySlug = newCategoryName.replace(/ /g,"-");
        try{
            let category = await this.findOne({categoryName:newCategorySlug});
            if(!category){
                category = await this.save(this.create({categoryName:newCategorySlug}));
            }
            return category;
        }catch(error){
            console.log(error);
        }
    }

}