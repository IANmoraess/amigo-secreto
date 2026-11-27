const FLAKES = [
  { left: '2%', size: 4, dur: '14s', delay: '-3s', drift: '14px', opacity: 0.72 },
  { left: '5%', size: 3, dur: '18s', delay: '-11s', drift: '-12px', opacity: 0.55 },
  { left: '8%', size: 5, dur: '12s', delay: '-6s', drift: '18px', opacity: 0.78 },
  { left: '11%', size: 3.5, dur: '16s', delay: '-14s', drift: '-15px', opacity: 0.6 },
  { left: '14%', size: 4.5, dur: '13.5s', delay: '-1.5s', drift: '12px', opacity: 0.75 },
  { left: '17%', size: 2.5, dur: '20s', delay: '-9s', drift: '-10px', opacity: 0.48 },
  { left: '20%', size: 5.5, dur: '11.5s', delay: '-7s', drift: '16px', opacity: 0.82 },
  { left: '23%', size: 3.5, dur: '17s', delay: '-15s', drift: '-14px', opacity: 0.58 },
  { left: '26%', size: 4, dur: '14.5s', delay: '-4s', drift: '10px', opacity: 0.65 },
  { left: '29%', size: 3, dur: '19s', delay: '-12s', drift: '-16px', opacity: 0.52 },
  { left: '32%', size: 5, dur: '12.5s', delay: '-8s', drift: '15px', opacity: 0.78 },
  { left: '35%', size: 3.5, dur: '16.5s', delay: '-1s', drift: '-12px', opacity: 0.6 },
  { left: '38%', size: 4.5, dur: '13s', delay: '-10s', drift: '14px', opacity: 0.74 },
  { left: '41%', size: 2.5, dur: '21s', delay: '-17s', drift: '9px', opacity: 0.45 },
  { left: '44%', size: 6, dur: '11s', delay: '-5s', drift: '-15px', opacity: 0.84 },
  { left: '47%', size: 4, dur: '15.5s', delay: '-13s', drift: '12px', opacity: 0.7 },
  { left: '50%', size: 3.5, dur: '17.5s', delay: '-3.5s', drift: '-11px', opacity: 0.6 },
  { left: '53%', size: 5, dur: '12.2s', delay: '-7.5s', drift: '16px', opacity: 0.76 },
  { left: '56%', size: 3, dur: '19.5s', delay: '-15.5s', drift: '-9px', opacity: 0.5 },
  { left: '59%', size: 4.5, dur: '14.2s', delay: '-2.5s', drift: '13px', opacity: 0.72 },
  { left: '62%', size: 3.5, dur: '16.8s', delay: '-11.5s', drift: '-14px', opacity: 0.58 },
  { left: '65%', size: 5.5, dur: '12.8s', delay: '-6.2s', drift: '17px', opacity: 0.8 },
  { left: '68%', size: 3, dur: '18.2s', delay: '-14.2s', drift: '-12px', opacity: 0.52 },
  { left: '71%', size: 4, dur: '15s', delay: '-4.8s', drift: '11px', opacity: 0.68 },
  { left: '74%', size: 2.5, dur: '21.5s', delay: '-16.5s', drift: '-10px', opacity: 0.46 },
  { left: '77%', size: 5, dur: '13.2s', delay: '-8.4s', drift: '15px', opacity: 0.76 },
  { left: '80%', size: 3.5, dur: '17.2s', delay: '-0.8s', drift: '-13px', opacity: 0.6 },
  { left: '83%', size: 4.5, dur: '14.8s', delay: '-9.6s', drift: '14px', opacity: 0.72 },
  { left: '86%', size: 3, dur: '18.8s', delay: '-5.4s', drift: '-15px', opacity: 0.52 },
  { left: '89%', size: 5.5, dur: '12s', delay: '-12.6s', drift: '16px', opacity: 0.8 },
  { left: '92%', size: 4, dur: '15.8s', delay: '-7.2s', drift: '-11px', opacity: 0.66 },
  { left: '95%', size: 3.5, dur: '17.8s', delay: '-3.2s', drift: '13px', opacity: 0.58 },
  { left: '98%', size: 4.5, dur: '13.8s', delay: '-10.8s', drift: '-14px', opacity: 0.7 },
  { left: '6%', size: 3, dur: '20.5s', delay: '-18s', drift: '10px', opacity: 0.48 },
  { left: '16%', size: 4, dur: '16s', delay: '-4.2s', drift: '-12px', opacity: 0.64 },
  { left: '28%', size: 5, dur: '13.6s', delay: '-14.8s', drift: '15px', opacity: 0.74 },
  { left: '40%', size: 3.5, dur: '18s', delay: '-6.8s', drift: '-13px', opacity: 0.58 },
  { left: '51%', size: 4.5, dur: '14.6s', delay: '-11.2s', drift: '12px', opacity: 0.7 },
  { left: '63%', size: 3, dur: '19.2s', delay: '-2.2s', drift: '-10px', opacity: 0.52 },
  { left: '75%', size: 5, dur: '12.6s', delay: '-16s', drift: '16px', opacity: 0.78 },
  { left: '87%', size: 3.5, dur: '17.4s', delay: '-8.8s', drift: '-12px', opacity: 0.6 },
  { left: '94%', size: 2.5, dur: '22s', delay: '-13.4s', drift: '9px', opacity: 0.46 },
];

/** Flocos de neve sutis em CSS puro para o fundo da página. */
export default function Snowfall() {
  return (
    <div
      aria-hidden="true"
      className="snowfall pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {FLAKES.map((flake, index) => (
        <span
          key={index}
          className="snowflake"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            '--snow-dur': flake.dur,
            '--snow-delay': flake.delay,
            '--snow-drift': flake.drift,
            '--snow-opacity': flake.opacity,
          }}
        />
      ))}
    </div>
  );
}
