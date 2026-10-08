import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";
import type { Response } from "express";

@Injectable()
export class AdminJsonInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (
          context.switchToHttp().getResponse<Response>().headersSent ||
          value === undefined
        )
          return value;
        return JSON.parse(
          JSON.stringify(value, (_key, v) =>
            typeof v === "bigint" ? Number(v) : v,
          ),
        );
      }),
    );
  }
}
