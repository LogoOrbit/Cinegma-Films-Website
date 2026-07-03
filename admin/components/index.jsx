/*
 * Analysis page entry — mounts the four Remotion components inside
 * @remotion/player and wires real dashboard metrics received via postMessage
 * from the admin dashboard. Bundled to analysis.bundle.js (no runtime CDN).
 */

import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";

import ProgressBars from "./ProgressBars.jsx";
import LineChart from "./LineChart.jsx";
import AreaChart from "./AreaChart.jsx";
import QuoteCard from "./QuoteCard.jsx";

function playerProps(w, h) {
  return {
    fps: 30,
    durationInFrames: 120,
    compositionWidth: w,
    compositionHeight: h,
    autoPlay: true,
    loop: true,
    controls: false,
    style: { width: "100%", height: "100%" },
  };
}

function App() {
  const [data, setData] = useState({
    skills: undefined,
    lineData: undefined,
    areaData: undefined,
  });

  useEffect(() => {
    function onMsg(e) {
      if (e.data && e.data.type === "analysis-data") {
        setData({
          skills: e.data.skills,
          lineData: e.data.lineData,
          areaData: e.data.areaData,
        });
      }
    }
    window.addEventListener("message", onMsg);
    if (window.parent) window.parent.postMessage({ type: "analysis-ready" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <div className="grid">
      <div className="card wide">
        <Player component={LineChart} inputProps={{ data: data.lineData }} {...playerProps(600, 340)} />
      </div>
      <div className="card wide">
        <Player component={AreaChart} inputProps={{ data: data.areaData }} {...playerProps(600, 340)} />
      </div>
      <div className="card small">
        <Player component={ProgressBars} inputProps={{ skills: data.skills }} {...playerProps(560, 385)} />
      </div>
      <div className="card small">
        <Player component={QuoteCard} inputProps={{}} {...playerProps(560, 385)} />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
