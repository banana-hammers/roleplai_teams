// Co-founder UUIDs — must match the is_blog_admin() SQL function
const ADMIN_UUIDS = [
  '44667060-b41c-4c47-aada-f0df8a90868c', // Ryan
  '34a3032a-8a69-4ab6-8273-f175ac849a42', // Rob
]

export function isAdmin(userId: string): boolean {
  return ADMIN_UUIDS.includes(userId)
}
