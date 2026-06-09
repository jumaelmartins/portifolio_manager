import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

export interface AuditContext {
  userId?: number;
  ipAddress?: string;
}

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditContext>();

  run<T>(context: AuditContext, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  getContext(): AuditContext | undefined {
    return this.storage.getStore();
  }
}
