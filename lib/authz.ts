import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function getUserRoleById(userId?: string | null): Promise<"admin" | "student" | null> {
  if (!userId) return null;
  try {
    const client = await clientPromise;
    const users = client.db().collection("users");
    const query = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { id: userId };
    const user = await users.findOne<{ role?: string }>(query as any);
    const role = user?.role === "admin" ? "admin" : "student";
    return role;
  } catch (_) {
    return null;
  }
}

export async function isAdminUser(userId?: string | null): Promise<boolean> {
  const role = await getUserRoleById(userId);
  return role === "admin";
}
