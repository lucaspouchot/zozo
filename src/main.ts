import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from "@nestjs/config";
import { logger } from '@zozo/common';
import { INestApplication, LoggerService } from "@nestjs/common";
let app: INestApplication;
let appLogger: LoggerService;

/**
 * the bootstrap function that init the server
 */
async function bootstrap() {
    appLogger = logger('ZOZO', { console: true, rotateFile: { path: 'log', nbDay: 8 }});
    app = await NestFactory.create(AppModule, {
        logger: appLogger,
    });


    const configService = app.get(ConfigService);

    const port = parseInt(configService.get('APP_PORT')) || 3000;
    const address = configService.get('APP_ADDRESS') || '0.0.0.0';

    app.setGlobalPrefix('api');

    app.enableCors({
        origin: '*',
    });

    await app.listen(port, address);
}
bootstrap().then(async () => {
    const url = await app.getUrl();
    appLogger.log({
        level: 'info',
        context: 'NestApplication',
        message: `Server is listening on ${url}`,
    });
}).catch(error => {
    console.error(error);
});
