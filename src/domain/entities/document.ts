export interface Document {
  readonly id: string;
  readonly ownerUserId: string;
  readonly title: string;
  readonly contentJson: string;
  readonly contentPlain: string;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface DocumentSummary {
  readonly id: string;
  readonly title: string;
  readonly version: number;
  readonly updatedAt: Date;
}
