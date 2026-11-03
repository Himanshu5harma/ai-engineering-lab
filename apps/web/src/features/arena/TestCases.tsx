import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import type { Challenge } from "../../api/client";

function display(value: unknown) {
  const compact = JSON.stringify(value);
  return compact && compact.length <= 100
    ? compact
    : JSON.stringify(value, null, 2);
}

export function TestCases({
  cases,
  value,
  onValueChange,
}: {
  cases: Challenge["public_cases"];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="testcase-view">
      <TabsList className="case-tabs" aria-label="Public test cases">
        {cases.map((item, index) => (
          <TabsTrigger key={item.name} value={String(index)}>
            Case {index + 1}
          </TabsTrigger>
        ))}
      </TabsList>
      {cases.map((item, index) => (
        <TabsContent
          key={item.name}
          value={String(index)}
          className="case-content"
        >
          <p className="case-name">{item.name}</p>
          <div className="case-inputs">
            {Object.entries(item.kwargs).map(([name, value]) => (
              <div key={name} className="case-input">
                <span>{name} =</span>
                <pre>{display(value)}</pre>
              </div>
            ))}
          </div>
          <div className="case-expected">
            <span>Expected</span>
            <code>
              {item.raises ? `raises ${item.raises}` : display(item.expected)}
            </code>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
