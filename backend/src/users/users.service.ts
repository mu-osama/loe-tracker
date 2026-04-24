import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { REALTIME_TOPICS, RealtimeService } from '../realtime/realtime.service';
import { CreateUserInput, UpdateUserInput, UserFilterInput } from './dto/user.input';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private realtimeService: RealtimeService,
  ) {}

  users(filter?: UserFilterInput) {
    const search = filter?.search?.trim();

    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            role: filter?.role,
            country: filter?.country || undefined,
            city: filter?.city || undefined,
            isActive: filter?.isActive,
          },
          ...(search
            ? [
                {
                  OR: [
                    { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { position: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  ],
                },
              ]
            : []),
        ],
      },
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
      take: filter?.limit || undefined,
    });
  }

  user(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(input: CreateUserInput) {
    const exists = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (exists) {
      throw new ConflictException('User email must be unique');
    }
    const password = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...input,
        password,
        role: input.role || 'USER',
      },
    });
    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.USER,
      entityId: user.id,
      userId: user.id,
    });
    return user;
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const data = { ...input } as Record<string, unknown>;
    if (input.password) {
      data.password = await bcrypt.hash(input.password, 10);
    }
    const user = await this.prisma.user.update({ where: { id }, data });
    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.USER,
      entityId: user.id,
      userId: user.id,
    });
    return user;
  }

  async deactivateUser(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.USER,
      entityId: user.id,
      userId: user.id,
    });
    return user;
  }
}
