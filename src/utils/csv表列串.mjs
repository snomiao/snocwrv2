import TSV from "TSV";

export const csv表列串 = s => TSV.CSV.parse(
    s
        .join("")
        .replace(/^#.*\n?$\n?/g, "")
        .trim()
);
