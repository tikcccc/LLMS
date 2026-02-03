const normalize = (value) => (value ?? "").toString().toLowerCase();

export const fuzzyMatch = (text, query) => {
  const q = normalize(query).trim();
  if (!q) return true;
  const t = normalize(text);
  if (t.includes(q)) return true;

  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i += 1) {
    if (t[i] === q[qi]) qi += 1;
  }
  return qi === q.length;
};

export const fuzzyMatchAny = (fields, query) => {
  const q = normalize(query).trim();
  if (!q) return true;
  return fields.some((field) => fuzzyMatch(field, q));
};
