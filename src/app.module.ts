import { LoggerMiddleware } from "./middleware/logger.middleware";
import { Logger, MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

export const fileForEnv = {
    'production': '.env',
    'development': '.env.dev',
    'test': '.env.test',
};

export const env = getNodeEnv(process.env.NODE_ENV);
const envFile = fileForEnv[env];

export function getNodeEnv(nodeEnv = '') {
    const mode = nodeEnv.toLowerCase();
    if (['', 'prod', 'production'].indexOf(mode) !== -1) {
        return 'production';
    } else if (['test'].indexOf(mode) !== -1) {
        return 'test';
    } else {
        return 'development';
    }
}

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [`${envFile}.local`, '.env.local', `${envFile}`, '.env'],
        }),
    ],
    controllers: [],
    providers: [Logger],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}