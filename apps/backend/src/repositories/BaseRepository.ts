
export abstract class BaseRepository<T> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  async findMany(
    where?: any,
    skip?: number,
    take?: number,
    orderBy?: any
  ): Promise<T[]> {
    return this.model.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  async create(data: any): Promise<T> {
    return this.model.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }

  async count(where?: any): Promise<number> {
    return this.model.count({
      where,
    });
  }

  async findOne(where: any): Promise<T | null> {
    return this.model.findFirst({
      where,
    });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async upsert(
    where: any,
    create: any,
    update: any
  ): Promise<T> {
    return this.model.upsert({
      where,
      create,
      update,
    });
  }

  async deleteMany(where?: any): Promise<{ count: number }> {
    return this.model.deleteMany({
      where,
    });
  }

  async updateMany(where: any, data: any): Promise<{ count: number }> {
    return this.model.updateMany({
      where,
      data,
    });
  }
}
