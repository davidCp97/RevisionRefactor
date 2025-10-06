export enum Status {
  CREATED = "CREATED",
  IN_TRANSIT = "IN_TRANSIT",
  ARRIVED = "ARRIVED",
  EXCEPTION = "EXCEPTION",
  COMPLETED = "COMPLETED",
}
export const isValidStatus = (s: string): s is Status =>
  Object.values(Status).includes(s as Status);
