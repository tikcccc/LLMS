export const ROLE_OPTIONS = [
  { value: "SITE_ADMIN", label: "Site Admin" },
  { value: "SITE_OFFICER", label: "Site Officer" },
  { value: "FIELD_STAFF", label: "Field Staff" },
];

export function roleLabel(value) {
  return ROLE_OPTIONS.find((role) => role.value === value)?.label ?? value;
}
