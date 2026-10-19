import { DIAGRAMS } from './diagrams';
import { StepDiagram } from './StepDiagram';
import { TestPyramid } from './TestPyramid';
import { HashMapBuckets } from './HashMapBuckets';
import { RaceCondition, RiskMatrix, SlidingWindow, SqlJoins } from './SmallViz';

const BESPOKE: Record<string, () => React.ReactElement> = {
  'test-pyramid': TestPyramid,
  'hashmap-buckets': HashMapBuckets,
  'sliding-window': SlidingWindow,
  'sql-joins': SqlJoins,
  'risk-matrix': RiskMatrix,
  'race-condition': RaceCondition,
};

export const VIZ_IDS = [...Object.keys(BESPOKE), ...Object.keys(DIAGRAMS)];

export function Visualization({ vizId }: { vizId: string }) {
  const Bespoke = BESPOKE[vizId];
  if (Bespoke) return <Bespoke />;
  const d = DIAGRAMS[vizId];
  if (d) return <StepDiagram spec={d.spec} label={d.label} />;
  return <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Visualization “{vizId}” is planned.</p>;
}
