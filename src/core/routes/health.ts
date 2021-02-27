import { Pool } from "pg";

export default async function health({ db }: { db: Pool }) {
  try {
    return {
      db: await db
        .query("SELECT 'OK' as status")
        .then(({ rows }) => rows[0].status),
    };
  } catch (error) {
    return {
      status: "NOT OK",
      error: error.message,
      code: 500,
    };
  }
}
