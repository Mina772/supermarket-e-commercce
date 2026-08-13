import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor?: Types.ObjectId;
  actorEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

export async function writeAuditLog(entry: Partial<IAuditLog>): Promise<void> {
  try {
    await AuditLog.create(entry);
  } catch {
    /* never let audit logging break the request */
  }
}
