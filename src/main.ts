import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from "@nestjs/config";
import { logger } from '@zozo/common';
import { INestApplication } from "@nestjs/common";
let app: INestApplication;
let port: number;

async function bootstrap() {
    app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);

    port = parseInt(configService.get('APP_PORT')) || 3000;
    const address = configService.get('APP_ADDRESS') || '0.0.0.0';

    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap().then(async () => {
    const url = await app.getUrl();
    logger.log({
        level: 'info',
        context: 'NestApplication',
        message: `Server is listening on ${url}`,
    });
}).catch(error => {
    console.error(error);
});
