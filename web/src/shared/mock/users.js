export const MOCK_USERS = [
  { id: "USER-001", name: "Ava Lau", email: "ava.lau@landsd.gov.hk", role: "SITE_ADMIN" },
  { id: "USER-002", name: "Chloe Yip", email: "chloe.yip@landsd.gov.hk", role: "SITE_ADMIN" },
  { id: "USER-003", name: "Kelvin Wong", email: "kelvin.wong@landsd.gov.hk", role: "SITE_OFFICER" },
  { id: "USER-004", name: "Grace Lee", email: "grace.lee@landsd.gov.hk", role: "SITE_OFFICER" },
  { id: "USER-005", name: "Jason Ng", email: "jason.ng@landsd.gov.hk", role: "SITE_OFFICER" },
  { id: "USER-006", name: "Eric Chan", email: "eric.chan@landsd.gov.hk", role: "SITE_OFFICER" },
  { id: "USER-007", name: "Mia Chan", email: "mia.chan@landsd.gov.hk", role: "FIELD_STAFF" },
  { id: "USER-008", name: "Daniel Ho", email: "daniel.ho@landsd.gov.hk", role: "FIELD_STAFF" },
  { id: "USER-009", name: "Natalie Lam", email: "natalie.lam@landsd.gov.hk", role: "FIELD_STAFF" },
  { id: "USER-010", name: "Raymond Cheung", email: "raymond.cheung@landsd.gov.hk", role: "FIELD_STAFF" },
  { id: "USER-011", name: "Fiona Tse", email: "fiona.tse@landsd.gov.hk", role: "FIELD_STAFF" },
  { id: "USER-012", name: "Henry Ma", email: "henry.ma@landsd.gov.hk", role: "FIELD_STAFF" },
];

export const buildUserOptions = (users = MOCK_USERS) =>
  users.map((user) => ({
    label: `${user.name} · ${user.email}`,
    value: user.name,
    name: user.name,
    email: user.email,
  }));

export const getDefaultAssignee = (role, users = MOCK_USERS) => {
  const match = users.find((user) => user.role === role);
  return match?.name ?? users[0]?.name ?? "";
};
