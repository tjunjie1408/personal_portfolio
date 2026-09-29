const long = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** 2026-09-29 → 29 Sep 2026. Dates are calendar days, so they are read as UTC. */
export const formatDate = (day: string) => long.format(new Date(`${day}T00:00:00Z`));

export const kindLabel = { essay: 'Essay', note: 'Note' } as const;
