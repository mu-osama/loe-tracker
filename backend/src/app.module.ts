import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AllocationsModule } from './allocations/allocations.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ExportModule } from './export/export.module';
import { LoeModule } from './loe/loe.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { UsersModule } from './users/users.module';

function parseCookieHeader(header?: string) {
  if (!header) {
    return {};
  }

  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) {
      return acc;
    }

    acc[rawKey] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>(
      {
        driver: ApolloDriver,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        cors: false,
        subscriptions: {
          'graphql-ws': true,
        },
        context: ({ req, res, extra }) => {
          const request = req ?? extra?.request;
          if (request && !request.cookies) {
            request.cookies = parseCookieHeader(request.headers?.cookie);
          }
          return { req: request, res };
        },
      } as ApolloDriverConfig & { cors: boolean },
    ),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    AllocationsModule,
    RealtimeModule,
    NotificationsModule,
    EmailModule,
    ExportModule,
    LoeModule,
    SchedulerModule,
  ],
})
export class AppModule {}
