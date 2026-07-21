import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import BpmDetectorPage from "../pages/BpmDetectorPage";
import KeyDetectorPage from "../pages/KeyDetectorPage";
import VocalSplitterPage from "../pages/VocalSplitterPage";
import ChordGeneratorPage from "../pages/ChordGeneratorPage";

describe("SEO Micro-Tool Landing Pages", () => {
  it("renders BpmDetectorPage with heading and tap tempo button", () => {
    render(
      <MemoryRouter initialEntries={["/bpm-detector"]}>
        <Routes>
          <Route path="/bpm-detector" element={<BpmDetectorPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/BPM Detector/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/TAP HERE FOR TEMPO/i)).toBeInTheDocument();
  });

  it("renders KeyDetectorPage with heading and upload button", () => {
    render(
      <MemoryRouter initialEntries={["/key-detector"]}>
        <Routes>
          <Route path="/key-detector" element={<KeyDetectorPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Audio Key Detector/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Upload Song \/ Audio Track/i)).toBeInTheDocument();
  });

  it("renders VocalSplitterPage on /vocal-remover route", () => {
    render(
      <MemoryRouter initialEntries={["/vocal-remover"]}>
        <Routes>
          <Route path="/vocal-remover" element={<VocalSplitterPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Vocal Remover/i).length).toBeGreaterThan(0);
  });

  it("renders ChordGeneratorPage with MIDI export option", () => {
    render(
      <MemoryRouter initialEntries={["/chord-progression-generator"]}>
        <Routes>
          <Route path="/chord-progression-generator" element={<ChordGeneratorPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Chord Progression/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Export as MIDI/i).length).toBeGreaterThan(0);
  });
});
