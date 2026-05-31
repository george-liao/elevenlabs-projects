export interface TranscriptTurn {
  id: string;
  role: "user" | "ai";
  text: string;
}
