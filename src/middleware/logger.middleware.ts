import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {

    private readonly logger = new Logger(LoggerMiddleware.name);
    constructor() {}

    use(req: any, res: any, next: () => void) {
        if (req.method && req.method !== 'OPTIONS') {
            const oldWrite = res.write;
            const oldEnd = res.end;
            const now = Date.now();
            const chunks = [];
            const resChunks = [];
            let body = undefined;
            let resBody = undefined;
            let requestErrorMessage = undefined;

            const getChunk = chunk => {
                return chunks.push(chunk);
            };
            const assembleBody = () => {
                if (chunks.length > 0 && chunks[0] instanceof Buffer || chunks[0] instanceof Uint8Array) {
                    body = Buffer.concat(chunks).toString();
                } else {
                    body = chunks.toString();
                }
                try {
                    body = JSON.parse(body);
                } catch (e) {
                }
                this.logHttpReq(req, res, body);
            };
            const getError = error => {
                requestErrorMessage = error.message;
            };
            req.on('data', getChunk);
            req.on('end', assembleBody);
            req.on('error', getError);

            res.write = (...restArgs) => {
                resChunks.push(Buffer.from(restArgs[0]));
                oldWrite.apply(res, restArgs);
            };
            res.end = (...restArgs) => {
                if (restArgs[0]) {
                    resChunks.push(Buffer.from(restArgs[0]));
                }
                if (resChunks.length > 0 && resChunks[0] instanceof Buffer || resChunks[0] instanceof Uint8Array) {
                    resBody = Buffer.concat(resChunks).toString();
                } else {
                    resBody = resChunks.toString();
                }
                try {
                    resBody = JSON.parse(resBody);
                } catch (e) {
                }
                oldEnd.apply(res, restArgs);
            };
            const logClose = () => {
                removeHandlers();
                this.logHttpRes(req, res, resBody, 'Client aborted', Date.now() - now);
            };
            const logError = error => {
                removeHandlers();
                this.logHttpRes(req, res, resBody, error.message, Date.now() - now);
            };
            const logFinish = () => {
                removeHandlers();
                this.logHttpRes(req, res, resBody, requestErrorMessage, Date.now() - now);
            };
            res.on('close', logClose);
            res.on('error', logError);
            res.on('finish', logFinish);

            function removeHandlers() {
                req.off('data', getChunk);
                req.off('end', assembleBody);
                req.off('error', getError);

                res.off('close', logClose);
                res.off('error', logError);
                res.off('finish', logFinish);
            }
        }

        next();
    }

    logHttpReq(req, res, body) {
        const { method, originalUrl:path, headers } = req;
        const apiVersion = headers['ffkmda-api-version'] || null;
        let ip = req.ip;
        if (headers['x-forwarded-for']) {
            ip = headers['x-forwarded-for'];
        }
        if (ip && ip.indexOf('.') !== -1 && ip.toLowerCase().substr(0, 7) === "::ffff:") {
            ip = ip.substr(7);
        }
        this.logger.verbose({
            protocol: 'HTTP',
            action: 'receive',
            method: method,
            path: path,
            ip: ip,
            apiVersion: apiVersion,
            message: 'http request',
            body: body,
        }, `${req.id}`);
    }

    logHttpRes(req, res, body, error, duration) {
        const contentLength = res.getHeader('content-length');
        this.logger.verbose({
            protocol: 'HTTP',
            action: 'send',
            message: 'http response',
            duration:`${duration}ms`,
            statusCode: res.statusCode,
            contentLength: contentLength,
            body: body,
            error: error,
        }, `${req.id}`);
    }

}
