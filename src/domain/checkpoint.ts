import { Status } from "./status";

export interface Checkpoint {
  id: string;
  unitId: string;
  status: Status;
  eventTime: Date;
}

export interface UnitLastStatus {
  unitId: string;
  lastStatus: Status;
  lastEventTime: Date;
}
