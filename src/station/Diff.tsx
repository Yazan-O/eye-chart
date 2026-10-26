function lineKind(line: string): string {
  if (line.startsWith("+++") || line.startsWith("---")) return "file";
  if (line.startsWith("@@")) return "hunk";
  if (line.startsWith("+")) return "add";
  if (line.startsWith("-")) return "del";
  return "ctx";
}

export default function Diff({ diff }: { diff: string }) {
  const lines = diff.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  return (
    <pre className="diff" data-testid="lens-diff" data-ui>
      <code>
        {lines.map((line, i) => (
          <span key={i} className={`diff-line diff-line--${lineKind(line)}`}>
            {line || " "}
            {"\n"}
          </span>
        ))}
      </code>
    </pre>
  );
}
