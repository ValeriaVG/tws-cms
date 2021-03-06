import { ColumnDefinition, sql, SQLDataSource } from "core/sql";

export type PageEventInput = {
  event: string;
  path: string;
  user_id?: number;
  ip?: string;
  headers?: Record<string, string | string[]>;
  payload?: Record<string, string>;
  created?: number;
};

export type PageEvent = PageEventInput & { id: number; created: number };

export default class Analytics extends SQLDataSource<
  PageEvent,
  PageEventInput
> {
  readonly collection = "analytics";

  readonly schema: Record<keyof PageEvent, ColumnDefinition> = {
    id: { type: "serial", primaryKey: true },
    event: { type: "varchar", length: 255 },
    path: { type: "varchar", length: 255 },
    user_id: { type: "int", nullable: true },
    ip: { type: "inet", nullable: true },
    headers: { type: "jsonb", nullable: true },
    payload: { type: "jsonb", nullable: true },
    created: { type: "timestamp", default: "NOW()" },
  };

  async viewsPerDay({
    from,
    to,
  }: {
    from: Date;
    to: Date;
  }): Promise<Array<{ date: Date; pageviews: number }>> {
    const {
      rows: items,
    } = await this.context.db.query(
      sql`SELECT "created"::date as date, COUNT(id)::int as count FROM ${this.collection} WHERE "event"='pageview' AND "created" BETWEEN $1 and $2 GROUP BY "created"::date ORDER BY "created"::date ASC`,
      [from, to]
    );
    return items;
  }
}
