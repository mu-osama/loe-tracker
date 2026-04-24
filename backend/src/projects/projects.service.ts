import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REALTIME_TOPICS, RealtimeService } from '../realtime/realtime.service';
import { CreateProjectInput, UpdateProjectInput } from './dto/project.input';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private realtimeService: RealtimeService,
  ) {}

  projects(includeInactive?: boolean) {
    return this.prisma.project.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createProject(input: CreateProjectInput) {
    const name = input.name?.trim();
    const code = input.code?.trim().toUpperCase();
    const description = input.description?.trim() || null;

    if (!name || !code) {
      throw new BadRequestException('Project name and code are required');
    }

    const exists = await this.prisma.project.findUnique({ where: { code } });
    if (exists) {
      throw new ConflictException('Project code must be unique');
    }
    const project = await this.prisma.project.create({
      data: {
        name,
        code,
        description,
      },
    });
    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.PROJECT,
      entityId: project.id,
    });
    return project;
  }

  async updateProject(id: string, input: UpdateProjectInput) {
    const data = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    };

    const project = await this.prisma.project.update({ where: { id }, data });
    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.PROJECT,
      entityId: project.id,
    });
    return project;
  }

  async deactivateProject(id: string) {
    const project = await this.prisma.project.update({ where: { id }, data: { isActive: false } });
    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.PROJECT,
      entityId: project.id,
    });
    return project;
  }
}
