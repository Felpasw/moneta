const STOPWORDS = new Set(["banco", "do", "de", "da", "dos", "das"]);

export const bankInitials = (bankName: string): string => {
  const words = bankName
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w.toLowerCase()));
  const source = words.length > 0 ? words : [bankName];
  if (source.length >= 2) {
    return (source[0][0] + source[1][0]).toUpperCase();
  }
  return source[0].slice(0, 2).toUpperCase();
};
