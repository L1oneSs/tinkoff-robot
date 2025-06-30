declare module 'plotly' {
  interface PlotlyTrace {
    x?: (string | number)[];
    y?: (string | number)[];
    values?: number[];
    labels?: string[];
    type?: string;
    mode?: string;
    name?: string;
    line?: { color?: string };
    yaxis?: string;
    marker?: { colors?: string[] };
  }

  interface PlotlyLayout {
    title?: string;
    xaxis?: { title?: string };
    yaxis?: { title?: string; side?: string };
    yaxis2?: { title?: string; side?: string; overlaying?: string };
    width?: number;
    height?: number;
  }

  interface PlotlyClient {
    plot(
      traces: PlotlyTrace[],
      layout: PlotlyLayout,
      callback: (error: Error | null, msg?: { url: string; filename: string }) => void
    ): void;
  }

  function plotly(username: string, apikey: string): PlotlyClient;
  export = plotly;
}
