import { Controller, Get } from "@nestjs/common";
import { CategoriesService, Category } from "./categories.service";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAllCategories(): Promise<Category[]> {
    return this.categoriesService.getCategories();
  }
}
