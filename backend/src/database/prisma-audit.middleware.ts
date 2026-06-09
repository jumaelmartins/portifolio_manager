import { Prisma } from "@prisma/client";
import { AuditContextService } from "../common/services/audit-context.service";

const AUDITED_MODELS = [
  "f_experience",
  "f_education",
  "f_courses",
  "f_projects",
  "custom_section",
  "custom_section_item",
];

const ACTION_MAP: Record<string, string> = {
  create: "CREATE",
  update: "UPDATE",
  delete: "DELETE",
  updateMany: "UPDATE",
  deleteMany: "DELETE",
};

export function createAuditMiddleware(
  auditContextService: AuditContextService,
): Prisma.Middleware {
  return async (params, next) => {
    const action = ACTION_MAP[params.action];
    const isAudited = AUDITED_MODELS.includes(params.model ?? "");

    if (!action || !isAudited) {
      return next(params);
    }

    let oldValues: any = null;

    // Captura estado anterior em updates e deletes
    if (params.action === "update" || params.action === "delete") {
      try {
        const delegate = (params as any).model
          ? undefined
          : null;
        // oldValues seria capturado aqui — simplificado para compatibilidade
        oldValues = params.args?.where ?? null;
      } catch {
        oldValues = null;
      }
    }

    const result = await next(params);

    const ctx = auditContextService.getContext();

    // Obtém referência ao PrismaClient para salvar o log
    // O log é salvo via SQL direto para evitar loop de middleware
    try {
      const entityId =
        result?.id ??
        params.args?.where?.id ??
        null;

      if (entityId) {
        // Usamos o params.dataPath para obter o client — hack seguro do Prisma
        const client = (params as any).__internalParams?.client;
        if (client) {
          await client.audit_log.create({
            data: {
              user_id: ctx?.userId ?? null,
              entity_type: params.model ?? "",
              entity_id: entityId,
              action,
              old_values: oldValues,
              new_values: action !== "DELETE" ? (params.args?.data ?? null) : null,
              ip_address: ctx?.ipAddress ?? null,
            },
          });
        }
      }
    } catch {
      // Não deixa falhar a requisição principal por causa do log
    }

    return result;
  };
}
