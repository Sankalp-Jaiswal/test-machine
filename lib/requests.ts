import { Db } from "mongodb";

/**
 * Generates an atomic, unique, sequential Request Number in the format:
 * REQ-YYYYMMDD-XXXXXX (where XXXXXX is a zero-padded 6-digit sequence incremented per date).
 */
export async function getNextRequestNumber(db: Db): Promise<string> {
  const dateObj = new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`; // YYYYMMDD

  const counterKey = `req_counter_${dateStr}`;
  const counterCol = db.collection("counters");

  const result = await counterCol.findOneAndUpdate(
    { _id: counterKey as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  const seq = result ? result.seq : 1;
  const seqStr = String(seq).padStart(6, "0");
  return `REQ-${dateStr}-${seqStr}`;
}
