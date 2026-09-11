// ─────────────────────────────────────────────────────────────────────────────
//  WorkAssignment — Field Service Domain Entity
//  Pure domain object — zero infrastructure imports.
// ─────────────────────────────────────────────────────────────────────────────

export type WorkAssignmentStatus =
  | 'draft'
  | 'scheduled'
  | 'assigned'
  | 'accepted'
  | 'travelling'
  | 'arrived'
  | 'working'
  | 'paused'
  | 'waiting_customer'
  | 'waiting_parts'
  | 'testing'
  | 'completed'
  | 'verified'
  | 'closed'
  | 'cancelled';

export type WorkAssignmentPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SlaBreachType = 'response' | 'arrival' | 'completion';

export const TERMINAL_STATES: ReadonlyArray<WorkAssignmentStatus> = [
  'completed',
  'verified',
  'closed',
  'cancelled',
];

export interface WorkAssignmentSla {
  responseDeadline?: Date;
  arrivalDeadline?: Date;
  completionDeadline?: Date;
  actualArrival?: Date;
  actualCompletion?: Date;
  breached: boolean;
  breachType?: SlaBreachType;
  breachReason?: string;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[]; // 0=Sun … 6=Sat
  endDate?: Date | string;
  maxOccurrences?: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  qty: number;
  reservedAt: Date;
  consumed: boolean;
}

export interface WorkAssignmentAi {
  estimatedDuration?: number; // minutes
  actualDuration?: number;    // minutes
  completionRate?: number;    // 0–100
  firstVisitResolution?: boolean;
  customerRating?: number;    // 1–5
  delayReason?: string;
  travelTime?: number;        // GPS-measured minutes
  energyConsumption?: number; // kWh
}

export interface WorkAssignmentLocation {
  address?: string;
  lat?: number;
  lng?: number;
}

export interface WorkAssignmentProps {
  id: string;
  title: string;
  description?: string;
  internalNotes?: string;
  status: WorkAssignmentStatus;
  priority: WorkAssignmentPriority;
  organizationId: string;
  assignedTo: string[];
  customerId?: string;
  branchId?: string;
  requiredSkills: string[];
  location?: WorkAssignmentLocation;
  travelTimeEstimateMins?: number;
  scheduledAt?: Date;
  estimatedDurationMins?: number;
  sla: WorkAssignmentSla;
  inventoryItems: InventoryItem[];
  recurrenceRule?: RecurrenceRule;
  parentAssignment?: string;
  seriesId?: string;
  nextOccurrence?: Date;
  ai: WorkAssignmentAi;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkAssignmentParams {
  title: string;
  description?: string;
  internalNotes?: string;
  priority?: WorkAssignmentPriority;
  organizationId: string;
  assignedTo?: string[];
  customerId?: string;
  branchId?: string;
  requiredSkills?: string[];
  location?: WorkAssignmentLocation;
  travelTimeEstimateMins?: number;
  scheduledAt?: Date;
  estimatedDurationMins?: number;
  sla?: Partial<WorkAssignmentSla>;
  inventoryItems?: Omit<InventoryItem, 'id' | 'reservedAt' | 'consumed'>[];
  recurrenceRule?: RecurrenceRule;
  createdBy?: string;
}

export class WorkAssignment {
  private readonly _props: WorkAssignmentProps;

  private constructor(props: WorkAssignmentProps) {
    this._props = { ...props };
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(
    id: string,
    params: CreateWorkAssignmentParams,
    now = new Date(),
  ): WorkAssignment {
    const inventoryItems: InventoryItem[] = (params.inventoryItems ?? []).map((item, idx) => ({
      id: `${id}-inv-${idx}`,
      productId: item.productId,
      qty: item.qty,
      reservedAt: now,
      consumed: false,
    }));

    return new WorkAssignment({
      id,
      title: params.title.trim(),
      description: params.description,
      internalNotes: params.internalNotes,
      status: 'draft',
      priority: params.priority ?? 'medium',
      organizationId: params.organizationId,
      assignedTo: params.assignedTo ?? [],
      customerId: params.customerId,
      branchId: params.branchId,
      requiredSkills: params.requiredSkills ?? [],
      location: params.location,
      travelTimeEstimateMins: params.travelTimeEstimateMins,
      scheduledAt: params.scheduledAt,
      estimatedDurationMins: params.estimatedDurationMins,
      sla: {
        breached: false,
        ...params.sla,
      },
      inventoryItems,
      recurrenceRule: params.recurrenceRule,
      ai: {},
      createdBy: params.createdBy,
      updatedBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: WorkAssignmentProps): WorkAssignment {
    return new WorkAssignment(props);
  }

  // ── Read-only accessors ────────────────────────────────────────────────────

  get id(): string { return this._props.id; }
  get title(): string { return this._props.title; }
  get description(): string | undefined { return this._props.description; }
  get internalNotes(): string | undefined { return this._props.internalNotes; }
  get status(): WorkAssignmentStatus { return this._props.status; }
  get priority(): WorkAssignmentPriority { return this._props.priority; }
  get organizationId(): string { return this._props.organizationId; }
  get assignedTo(): string[] { return [...this._props.assignedTo]; }
  get customerId(): string | undefined { return this._props.customerId; }
  get branchId(): string | undefined { return this._props.branchId; }
  get requiredSkills(): string[] { return [...this._props.requiredSkills]; }
  get location(): WorkAssignmentLocation | undefined { return this._props.location; }
  get travelTimeEstimateMins(): number | undefined { return this._props.travelTimeEstimateMins; }
  get scheduledAt(): Date | undefined { return this._props.scheduledAt; }
  get estimatedDurationMins(): number | undefined { return this._props.estimatedDurationMins; }
  get sla(): WorkAssignmentSla { return { ...this._props.sla }; }
  get inventoryItems(): InventoryItem[] { return [...this._props.inventoryItems]; }
  get recurrenceRule(): RecurrenceRule | undefined { return this._props.recurrenceRule; }
  get parentAssignment(): string | undefined { return this._props.parentAssignment; }
  get seriesId(): string | undefined { return this._props.seriesId; }
  get nextOccurrence(): Date | undefined { return this._props.nextOccurrence; }
  get ai(): WorkAssignmentAi { return { ...this._props.ai }; }
  get createdBy(): string | undefined { return this._props.createdBy; }
  get updatedBy(): string | undefined { return this._props.updatedBy; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }

  isTerminal(): boolean {
    return (TERMINAL_STATES as ReadonlyArray<string>).includes(this._props.status);
  }

  // ── Domain behaviours ──────────────────────────────────────────────────────

  /**
   * Transition to a new status, throwing if already terminal.
   */
  transitionStatus(newStatus: WorkAssignmentStatus, now = new Date()): WorkAssignment {
    if (this.isTerminal()) {
      throw new Error(`Cannot transition from terminal state "${this._props.status}"`);
    }
    const updatedSla = { ...this._props.sla };
    const updatedAi = { ...this._props.ai };

    // Capture SLA actual arrival timestamp
    if (newStatus === 'arrived') {
      updatedSla.actualArrival = now;
    }

    // Capture SLA actual completion timestamp and check for breach
    if (newStatus === 'completed' || newStatus === 'closed') {
      updatedSla.actualCompletion = now;
      if (updatedSla.completionDeadline && now > updatedSla.completionDeadline && !updatedSla.breached) {
        updatedSla.breached = true;
        updatedSla.breachType = 'completion';
      }
    }

    return new WorkAssignment({
      ...this._props,
      status: newStatus,
      sla: updatedSla,
      ai: updatedAi,
      updatedAt: now,
    });
  }

  /**
   * Record actual arrival for SLA tracking.
   */
  markSlaArrived(now = new Date()): WorkAssignment {
    return new WorkAssignment({
      ...this._props,
      sla: { ...this._props.sla, actualArrival: now },
      updatedAt: now,
    });
  }

  /**
   * Record actual completion and check SLA breach.
   */
  markSlaCompleted(now = new Date()): WorkAssignment {
    const sla = { ...this._props.sla, actualCompletion: now };
    if (sla.completionDeadline && now > sla.completionDeadline && !sla.breached) {
      sla.breached = true;
      sla.breachType = 'completion';
    }
    return new WorkAssignment({ ...this._props, sla, updatedAt: now });
  }

  /**
   * Reserve an inventory item for this assignment.
   */
  addInventoryItem(
    id: string,
    productId: string,
    qty: number,
    now = new Date(),
  ): WorkAssignment {
    const item: InventoryItem = { id, productId, qty, reservedAt: now, consumed: false };
    return new WorkAssignment({
      ...this._props,
      inventoryItems: [...this._props.inventoryItems, item],
      updatedAt: now,
    });
  }

  /**
   * Mark an inventory item as consumed (used on-site).
   */
  consumeInventoryItem(itemId: string, now = new Date()): WorkAssignment {
    const inventoryItems = this._props.inventoryItems.map(item =>
      item.id === itemId ? { ...item, consumed: true } : item,
    );
    return new WorkAssignment({ ...this._props, inventoryItems, updatedAt: now });
  }

  /**
   * Calculate actual duration (minutes) from scheduledAt → actualCompletion.
   */
  calculateActualDuration(): number | undefined {
    if (!this._props.scheduledAt || !this._props.sla.actualCompletion) return undefined;
    return Math.round(
      (this._props.sla.actualCompletion.getTime() - this._props.scheduledAt.getTime()) / 60_000,
    );
  }

  toPersistence(): WorkAssignmentProps {
    return { ...this._props };
  }
}
