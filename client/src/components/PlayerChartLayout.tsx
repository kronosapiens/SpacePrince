import {
  createContext, useContext, useLayoutEffect, useMemo, useRef, useState,
  type Dispatch, type ReactNode, type RefObject, type SetStateAction,
} from "react";
import type { ChartProps } from "./Chart";
import { ChartInspection, type ChartInspectionProps } from "./ChartInspection";

interface Presentation {
  props: ChartProps;
  onBackgroundClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  label?: string;
  guideId?: string;
  className?: string;
}

const Context = createContext<{
  publish: Dispatch<SetStateAction<Presentation | null>>;
  chartRef: RefObject<HTMLDivElement>;
} | null>(null);

/** Encounter state stays in its controller; only its chart presentation is shared. */
export function usePlayerChart(presentation: Presentation): RefObject<HTMLDivElement> {
  const context = useContext(Context);
  if (!context) throw new Error("usePlayerChart requires PlayerChartLayout");
  const { publish, chartRef } = context;
  useLayoutEffect(() => { publish(presentation); });
  useLayoutEffect(() => () => publish(null), [publish]);
  return chartRef;
}

export function PlayerChartLayout({ children, className, ...chart }: ChartInspectionProps & {
  children: ReactNode;
  className: string;
}) {
  const [presentation, publish] = useState<Presentation | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const context = useMemo(() => ({ publish, chartRef }), []);

  return (
    <Context.Provider value={context}>
      <div
        className={`chart-layout ${className} ${presentation?.className ?? ""}`}
        onClick={presentation?.onBackgroundClick}
      >
        <div
          className="chart-layout-chart"
          data-guide={presentation?.guideId ?? "chart"}
          ref={chartRef}
          onMouseEnter={presentation?.onMouseEnter}
          onMouseLeave={presentation?.onMouseLeave}
        >
          {presentation?.label && (
            <div className="chart-layout-label combat-side-label" data-guide="label-self">
              {presentation.label}
            </div>
          )}
          <ChartInspection {...chart} presentation={presentation?.props} />
        </div>
        {/* Children retain their identity when a controller updates the chart. */}
        {children}
      </div>
    </Context.Provider>
  );
}
