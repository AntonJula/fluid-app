const RHYTHM_MESSAGES = [
  "Small sips",
  "Calm progress",
  "Your own pace",
  "Local-first data",
];

export function RhythmMarquee() {
  return (
    <div
      className="fluid-rhythm-marquee"
      aria-label="Fluid keeps hydration calm, personal, and private"
      data-fluid-reveal
    >
      <div className="fluid-rhythm-marquee-track">
        {[0, 1].map((copyIndex) => (
          <div key={copyIndex} className="fluid-rhythm-marquee-copy" aria-hidden={copyIndex === 1}>
            {RHYTHM_MESSAGES.map((message) => (
              <span key={`${copyIndex}-${message}`} className="fluid-rhythm-marquee-item">
                <span className="fluid-rhythm-marquee-dot" />
                {message}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
