export class CategoryNotFoundError extends Error {
  constructor(categoryId: string) {
    super(`Category not found or not owned by user: ${categoryId}`);
    this.name = 'CategoryNotFoundError';
  }
}
