import { describe, it, expect } from "vitest";
import { getNextRequestNumber } from "../lib/requests";

// Simple mock for Db and Collection to simulate MongoDB behavior
const createMockDb = () => {
  const store: Record<string, { _id: string; seq: number }> = {};
  
  const mockCollection = {
    findOneAndUpdate: async (filter: { _id: string }, update: { $inc: { seq: number } }, options?: { upsert?: boolean, returnDocument?: string }) => {
      const id = filter._id;
      // Simulate real asynchronous DB roundtrip delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
      if (!store[id]) {
        store[id] = { _id: id, seq: 0 };
      }
      store[id].seq += update.$inc.seq;
      return { ...store[id] };
    }
  };

  const mockDb = {
    collection: (name: string) => {
      if (name === "counters") return mockCollection;
      throw new Error(`Collection ${name} not mocked`);
    }
  };

  return mockDb as any;
};

describe("getNextRequestNumber", () => {
  it("generates request number in the correct YYYYMMDD format", async () => {
    const db = createMockDb();
    const reqNum = await getNextRequestNumber(db);
    
    // Format should match REQ-YYYYMMDD-000001
    expect(reqNum).toMatch(/^REQ-\d{8}-\d{6}$/);
  });

  it("increments sequential numbers correctly", async () => {
    const db = createMockDb();
    const req1 = await getNextRequestNumber(db);
    const req2 = await getNextRequestNumber(db);
    const req3 = await getNextRequestNumber(db);

    expect(req1).toMatch(/000001$/);
    expect(req2).toMatch(/000002$/);
    expect(req3).toMatch(/000003$/);
  });

  it("handles concurrent generation safety", async () => {
    const db = createMockDb();
    
    // Run 5 requests concurrently
    const results = await Promise.all([
      getNextRequestNumber(db),
      getNextRequestNumber(db),
      getNextRequestNumber(db),
      getNextRequestNumber(db),
      getNextRequestNumber(db)
    ]);

    // Check all are unique
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(5);

    // Verify they incremented sequentially
    const sequences = results.map(r => parseInt(r.split("-")[2], 10)).sort();
    expect(sequences).toEqual([1, 2, 3, 4, 5]);
  });
});
