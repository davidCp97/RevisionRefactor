import { Checkpoint } from "../checkpoint";
import { Status } from "../status";
import { DomainRuleViolation } from "../../shared/errors";

export class TransitionPolicy {
  /**
   * Reglas:
   * - CREATED único por unidad.
   * - Tiempos no decrecientes.
   * - No repetir el mismo estado consecutivo (salvo EXCEPTION permitida en repetición si es necesario, aquí la evitamos).
   * - No retroceso (orden lógico simple: CREATED -> IN_TRANSIT -> ARRIVED/COMPLETED; EXCEPTION puede ocurrir en cualquier momento).
   */
  static validate(next: { unitId: string; status: Status; eventTime: Date }, history: Checkpoint[]) {
    const sorted = [...history].sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());
    const last = sorted.at(-1);

    if (next.status === Status.CREATED && sorted.some(c => c.status === Status.CREATED)) {
      throw new DomainRuleViolation("CREATED ya fue registrado para esta unidad.");
    }
    if (last && next.eventTime.getTime() < last.eventTime.getTime()) {
      throw new DomainRuleViolation("El eventTime no puede ser menor que el último checkpoint.");
    }
    if (last && last.status === next.status) {
      throw new DomainRuleViolation("No se permite repetir el mismo estado consecutivo.");
    }
    // Orden simple (no retroceso)
    const order = [Status.CREATED, Status.IN_TRANSIT, Status.ARRIVED, Status.COMPLETED];
    const isForward = (from?: Status, to?: Status) => {
      if (!from || !to) return true;
      if (to === Status.EXCEPTION) return true; // EXCEPTION es asíncrono
      if (from === Status.EXCEPTION) return true; // desde EXCEPTION se permite continuar
      return order.indexOf(to) >= order.indexOf(from);
    };
    if (last && !isForward(last.status, next.status)) {
      throw new DomainRuleViolation("Transición de estado no permitida (retroceso).");
    }
  }

  static deriveLastStatus(history: Checkpoint[]): { lastStatus: Status | null; at: Date | null } {
    if (history.length === 0) return { lastStatus: null, at: null };
    const sorted = [...history].sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());
    // Derivar ignorando EXCEPTION si existe un estado más reciente “no excepcional”
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].status !== Status.EXCEPTION) {
        return { lastStatus: sorted[i].status, at: sorted[i].eventTime };
      }
    }
    // Si solo hay EXCEPTION, el último es EXCEPTION
    const last = sorted.at(-1)!;
    return { lastStatus: last.status, at: last.eventTime };
  }
}
