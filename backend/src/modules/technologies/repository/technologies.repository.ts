import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { CreateTechnologyDto } from "../dto/create-technology.dto";
import { UpdateTechnologyDto } from "../dto/update-technology.dto";
import { d_technologies } from "@prisma/client";


@Injectable()
export class TechnologiesRepository {
    constructor(
        private prismaService: PrismaService
    ) {}
    async create(data: CreateTechnologyDto): Promise<d_technologies> {
        return await this.prismaService.d_technologies.create({ data });
    }
    async findAll(): Promise<d_technologies[] | null> {
        return await this.prismaService.d_technologies.findMany();
    }
    async findById(id: number): Promise<d_technologies | null> {
        return await this.prismaService.d_technologies.findUnique({ where: { id } });
    }
    async findByTech(tech: string): Promise<d_technologies | null> {
        return await this.prismaService.d_technologies.findUnique({ where: { tech } });
    }
    async update(id: number, data: UpdateTechnologyDto): Promise<d_technologies | null> {
        return await this.prismaService.d_technologies.update({ where: { id }, data });
    }
    async delete(id: number) {
        return await this.prismaService.d_technologies.delete({ where: { id } });
    }
}
